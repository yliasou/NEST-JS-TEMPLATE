import { randomUUID } from "crypto";
import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Gender, Role } from "@prisma/client";
import { AuditActionsService } from "../../../audit-trails/recorder/services/audit-actions.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { translate, type Locale } from "../../../common/i18n";
import { validationErrorResponse } from "../../../common/utils/response.util";
import { mapUserDemographics } from "../../../profile/utils/profile-user.util";
import { AuthResponse } from "../interfaces/auth-response.interface";
import type { JwtPayload } from "../../shared/guards/jwt-auth.guard";
import { AuthTokenRevocationStore } from "./auth-token-revocation.store";
import { AuthUserSessionService } from "./auth-user-session.service";
import {
  getJwtAccessExpiresInSeconds,
  getJwtRefreshExpiresInSeconds,
} from "../config/jwt-expiry.config";

export interface AuthenticatedUserSummary {
  id: string;
  role: Role;
}

export type AccessTokenDiagnosis =
  | { ok: true; user: AuthenticatedUserSummary }
  | {
      ok: false;
      reason:
        | "jwt_verify_echec"
        | "jwt_type_incorrect"
        | "sub_introuvable_en_base"
        | "token_revoke";
      detail?: string;
    };

function buildDisplayName(
  profile: { firstName: string; lastName: string } | null,
): string {
  if (!profile) return "";
  return `${profile.firstName} ${profile.lastName}`.trim();
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly auditActions: AuditActionsService,
    private readonly tokenRevocation: AuthTokenRevocationStore,
    private readonly authUserSession: AuthUserSessionService,
  ) {}

  signTokenPair(
    userId: string,
    role: Role,
  ): { accessToken: string; refreshToken: string } {
    const accessExpiresIn = getJwtAccessExpiresInSeconds();
    const refreshExpiresIn = getJwtRefreshExpiresInSeconds();

    return {
      accessToken: this.jwtService.sign(
        { sub: userId, type: "access", role },
        { expiresIn: accessExpiresIn, jwtid: randomUUID() },
      ),
      refreshToken: this.jwtService.sign(
        { sub: userId, type: "refresh" },
        { expiresIn: refreshExpiresIn, jwtid: randomUUID() },
      ),
    };
  }

  buildAuthResponse(user: {
    id: string;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    role: string;
    dateOfBirth?: Date | null;
    gender?: Gender | null;
    residentialAddress?: string | null;
    emailVerifiedAt?: Date | null;
    phoneVerifiedAt?: Date | null;
    profile: {
      firstName: string;
      lastName: string;
    } | null;
    adminProfile?: {
      level: string;
    } | null;
  }): AuthResponse {
    const tokens = this.signTokenPair(user.id, user.role as Role);
    const name = buildDisplayName(user.profile);
    const demographics = mapUserDemographics({
      dateOfBirth: user.dateOfBirth ?? null,
      gender: user.gender ?? null,
      residentialAddress: user.residentialAddress ?? null,
    });
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl ?? null,
        name,
        role: user.role,
        adminLevel:
          user.role === Role.ADMIN ? (user.adminProfile?.level ?? null) : null,
        emailVerified: Boolean(user.emailVerifiedAt),
        phoneVerified: Boolean(user.phoneVerifiedAt),
        ...demographics,
      },
    };
  }

  async refresh(
    refreshToken: string,
    locale: Locale,
  ): Promise<Pick<AuthResponse, "accessToken" | "refreshToken">> {
    const refreshInvalid = () =>
      new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, "refreshInvalid")],
          undefined,
          locale,
        ),
      );

    type RefreshPayload = { sub: string; type?: string; exp?: number };

    let payload: RefreshPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshPayload>(refreshToken);
    } catch {
      throw refreshInvalid();
    }

    if (payload.type !== "refresh") {
      throw refreshInvalid();
    }

    const remainingTtlSec = payload.exp
      ? payload.exp - Math.floor(Date.now() / 1000)
      : getJwtRefreshExpiresInSeconds();
    if (!(await this.tokenRevocation.consume(refreshToken, remainingTtlSec))) {
      throw refreshInvalid();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        role: true,
        authProvider: true,
        isActive: true,
        deletedAt: true,
      },
    });
    if (!user || !user.isActive || user.deletedAt) {
      throw refreshInvalid();
    }

    await this.auditActions.authRefreshToken(user.id, {
      authProvider: user.authProvider,
    });

    void this.authUserSession.touchLastLoginAt(user.id);

    return this.signTokenPair(user.id, user.role);
  }

  /**
   * Verifie un JWT access et retourne `{ id, role }` ou `null` si invalide.
   * Utilise par les consommateurs HTTP/Socket qui ont juste besoin du user.
   */
  async verifyAccessTokenAndGetUser(
    token: string,
  ): Promise<AuthenticatedUserSummary | null> {
    const result = await this.verifyAccessTokenDiagnose(token);
    return result.ok ? result.user : null;
  }

  /**
   * Comme `verifyAccessTokenAndGetUser` mais retourne uniquement l id.
   */
  async verifyAccessTokenAndGetUserId(token: string): Promise<string | null> {
    const user = await this.verifyAccessTokenAndGetUser(token);
    return user?.id ?? null;
  }

  /**
   * Variante qui retourne un diagnostic precis (utile pour les logs de debug,
   * notamment cote Socket.IO).
   */
  async verifyAccessTokenDiagnose(
    token: string,
  ): Promise<AccessTokenDiagnosis> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      return { ok: false, reason: "jwt_verify_echec", detail };
    }

    if (payload.type && payload.type !== "access") {
      return {
        ok: false,
        reason: "jwt_type_incorrect",
        detail: payload.type,
      };
    }

    if (await this.tokenRevocation.isRevoked(token)) {
      return { ok: false, reason: "token_revoke" };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isActive: true, deletedAt: true },
    });
    if (!user || !user.isActive || user.deletedAt) {
      return {
        ok: false,
        reason: "sub_introuvable_en_base",
        detail: payload.sub,
      };
    }

    return { ok: true, user: { id: user.id, role: user.role } };
  }
}
