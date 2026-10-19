import * as bcrypt from "bcrypt";
import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuditActionsService } from "../../../audit-trails/recorder/services/audit-actions.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { translate, type Locale } from "../../../common/i18n";
import { AuthResponse } from "../interfaces/auth-response.interface";
import {
  adminLoginUserSelect,
  type LocalLoginUser,
  localLoginUserSelect,
} from "./login.select";
import { TokenService } from "./token.service";
import { AuthPhoneService } from "../../phone/services/auth-phone.service";
import { AuthUserSessionService } from "./auth-user-session.service";

/** Rounds bcrypt à l'inscription — comparaison async, pas de réduction pour la perf login. */
const BCRYPT_ROUNDS_DOCUMENTATION = 10;

type LoginPerfBreakdown = {
  lookupMs: number;
  passwordMs: number;
  tokensMs: number;
  refreshStoreMs: number;
  totalMs: number;
  statusCode: number;
};

type AuthenticateLocalOptions = {
  requireAdmin: boolean;
  credentialsKey?: "invalidCredentials" | "invalidPin";
};

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly auditActions: AuditActionsService,
    private readonly authUserSession: AuthUserSessionService,
    private readonly authPhone: AuthPhoneService,
  ) {}

  /** Parcours téléphone : numéro + code PIN. */
  async loginWithPhone(
    phoneNumber: string,
    secretCode: string,
    locale: Locale,
  ): Promise<AuthResponse> {
    const phone = this.authPhone.normalizeRequiringDialCode(
      phoneNumber,
      locale,
    );
    return this.authenticateLocal({ phone }, secretCode, locale, {
      requireAdmin: false,
      credentialsKey: "invalidPin",
    });
  }

  /** Parcours e-mail : e-mail + mot de passe (connexion possible avant vérification). */
  async loginWithEmail(
    email: string,
    password: string,
    locale: Locale,
  ): Promise<AuthResponse> {
    return this.authenticateLocal({ email }, password, locale, {
      requireAdmin: false,
      credentialsKey: "invalidCredentials",
    });
  }

  async loginAdminWithEmail(
    email: string,
    password: string,
    locale: Locale,
  ): Promise<AuthResponse> {
    return this.authenticateLocal({ email }, password, locale, {
      requireAdmin: true,
    });
  }

  private emptyPerf(): LoginPerfBreakdown {
    return {
      lookupMs: 0,
      passwordMs: 0,
      tokensMs: 0,
      refreshStoreMs: 0,
      totalMs: 0,
      statusCode: 200,
    };
  }

  private async authenticateLocal(
    params: { email?: string; phone?: string },
    password: string,
    locale: Locale,
    options: AuthenticateLocalOptions,
  ): Promise<AuthResponse> {
    const startedAt = Date.now();
    const perf = this.emptyPerf();
    const user = await this.verifyLocalCredentials(
      params,
      password,
      locale,
      options,
      perf,
      startedAt,
    );

    return this.openLocalSession(user, perf, startedAt);
  }

  private openLocalSession(
    user: LocalLoginUser,
    perf: LoginPerfBreakdown,
    startedAt: number,
  ): AuthResponse {
    void this.auditActions.authLogin(user.id, {
      authProvider: user.authProvider,
    });
    void this.authUserSession.touchLastLoginAt(user.id);

    const tokensStart = Date.now();
    const response = this.tokenService.buildAuthResponse(user);
    perf.tokensMs = Date.now() - tokensStart;
    perf.totalMs = Date.now() - startedAt;
    this.logLoginPerformance(perf);
    return response;
  }

  private async verifyLocalCredentials(
    params: { email?: string; phone?: string },
    password: string,
    locale: Locale,
    options: AuthenticateLocalOptions,
    perf: LoginPerfBreakdown,
    startedAt: number,
  ): Promise<LocalLoginUser> {
    const lookupStart = Date.now();
    const user = await this.findUserForLocalLogin(params, options.requireAdmin);
    perf.lookupMs = Date.now() - lookupStart;

    if (
      !user ||
      user.deletedAt ||
      (options.requireAdmin && user.role !== Role.ADMIN)
    ) {
      perf.statusCode = 401;
      perf.totalMs = Date.now() - startedAt;
      this.logLoginPerformance(perf);
      throw new UnauthorizedException(
        translate(locale, options.credentialsKey ?? "invalidCredentials"),
      );
    }

    if (!user.isActive) {
      perf.statusCode = 401;
      perf.totalMs = Date.now() - startedAt;
      this.logLoginPerformance(perf);
      throw new UnauthorizedException(translate(locale, "accountInactive"));
    }

    const passwordStart = Date.now();
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    perf.passwordMs = Date.now() - passwordStart;

    if (!passwordValid) {
      perf.statusCode = 401;
      perf.totalMs = Date.now() - startedAt;
      this.logLoginPerformance(perf);
      throw new UnauthorizedException(
        translate(locale, options.credentialsKey ?? "invalidCredentials"),
      );
    }

    return user;
  }

  private async findUserForLocalLogin(
    params: { email?: string; phone?: string },
    includeAdminProfile: boolean,
  ): Promise<LocalLoginUser | null> {
    const select = includeAdminProfile
      ? adminLoginUserSelect
      : localLoginUserSelect;

    if (params.email?.trim()) {
      return this.prisma.user.findUnique({
        where: { email: params.email.trim().toLowerCase() },
        select,
      });
    }

    const phone = params.phone?.trim();
    if (!phone) {
      return null;
    }

    return this.prisma.user.findUnique({
      where: { phone },
      select,
    });
  }

  private logLoginPerformance(perf: LoginPerfBreakdown): void {
    this.logger.log(
      `${perf.statusCode} - total=${perf.totalMs}ms ` +
        `lookup=${perf.lookupMs}ms password=${perf.passwordMs}ms ` +
        `tokens=${perf.tokensMs}ms refreshStore=${perf.refreshStoreMs}ms ` +
        `(bcrypt rounds=${BCRYPT_ROUNDS_DOCUMENTATION}, refresh JWT stateless)`,
    );
  }
}
