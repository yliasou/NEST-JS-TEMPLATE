import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { normalizeLocale, translate, type Locale } from "../../../common/i18n";
import type { Role } from "@prisma/client";
import { ROLES_KEY } from "../../../common/rbac/roles.constants";
import { PrismaService } from "../../../prisma/prisma.service";
import { IS_PUBLIC_KEY } from "../auth.constants";
import { AuthTokenRevocationStore } from "../../session/services/auth-token-revocation.store";
import { AuthUserSessionService } from "../../session/services/auth-user-session.service";
import { extractBearerToken } from "../../session/utils/bearer-token.util";

export interface JwtPayload {
  sub: string;
  type?: string;
  role?: Role;
  /** Incrémenté à chaque changement de mot de passe / PIN. */
  tv?: number;
}

const jwtUserLookupSelect = {
  id: true,
  role: true,
  isActive: true,
  deletedAt: true,
  lastRequestAt: true,
  tokenVersion: true,
} as const;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly tokenRevocation: AuthTokenRevocationStore,
    private readonly userSession: AuthUserSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const locale = this.locale(request);

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      const token = this.extractToken(request);
      if (token) {
        try {
          await this.attachUserFromToken(request, context, token, locale);
        } catch {
          // Route publique : un jeton invalide n'empêche pas l'accès.
        }
      }
      return true;
    }

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException(translate(locale, "tokenMissing"));
    }

    try {
      await this.attachUserFromToken(request, context, token, locale);
      return true;
    } catch (e) {
      if (
        e instanceof UnauthorizedException ||
        e instanceof ForbiddenException
      ) {
        throw e;
      }
      throw new UnauthorizedException(
        translate(locale, "tokenInvalidOrExpired"),
      );
    }
  }

  private async attachUserFromToken(
    request: Request,
    context: ExecutionContext,
    token: string,
    locale: Locale,
  ): Promise<void> {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    if (payload.type && payload.type !== "access") {
      throw new UnauthorizedException(translate(locale, "tokenInvalid"));
    }

    if (await this.tokenRevocation.isRevoked(token)) {
      throw new UnauthorizedException(
        translate(locale, "tokenInvalidOrExpired"),
      );
    }

    const role = await this.resolveUserRole(payload, locale);
    this.assertRequiredRoles(context, role);

    request["user"] = {
      ...payload,
      id: payload.sub,
      role,
    };
  }

  /**
   * Le rôle fait foi en base, pas dans le JWT : un compte rétrogradé ou désactivé
   * perd ses droits immédiatement, sans attendre l'expiration de l'access token.
   */
  private async resolveUserRole(
    payload: JwtPayload,
    locale: Locale,
  ): Promise<Role> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: jwtUserLookupSelect,
    });
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException(
        translate(locale, "tokenInvalidOrExpired"),
      );
    }

    if ((payload.tv ?? 0) !== user.tokenVersion) {
      throw new UnauthorizedException(
        translate(locale, "tokenInvalidOrExpired"),
      );
    }

    this.userSession.noteAuthenticatedRequest(user.id, user.lastRequestAt);
    return user.role;
  }

  private assertRequiredRoles(context: ExecutionContext, role: Role): void {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return;
    }

    const userRoleNormalized = String(role).toLowerCase();
    const requiredNormalized = requiredRoles.map((r) =>
      String(r).toLowerCase(),
    );

    if (!requiredNormalized.includes(userRoleNormalized)) {
      throw new ForbiddenException();
    }
  }

  private locale(req: Request): Locale {
    return req.locale ?? normalizeLocale(req.headers.language as string);
  }

  private extractToken(request: Request): string | undefined {
    return extractBearerToken(request);
  }
}
