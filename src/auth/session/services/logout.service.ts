import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuditActionsService } from "../../../audit-trails/recorder/services/audit-actions.service";
import { translate, type Locale } from "../../../common/i18n";
import { PrismaService } from "../../../prisma/prisma.service";
import { AuthTokenRevocationStore } from "./auth-token-revocation.store";
import {
  getJwtAccessExpiresInSeconds,
  getJwtRefreshExpiresInSeconds,
} from "../config/jwt-expiry.config";

@Injectable()
export class LogoutService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly tokenRevocation: AuthTokenRevocationStore,
    private readonly auditActions: AuditActionsService,
  ) {}

  async logout(
    userId: string,
    accessToken: string,
    refreshToken: string | undefined,
    locale: Locale,
  ): Promise<void> {
    if (!accessToken.trim()) {
      throw new UnauthorizedException(translate(locale, "tokenMissing"));
    }

    await this.tokenRevocation.revoke(
      accessToken,
      this.remainingTtlSec(accessToken, this.accessFallbackTtlSec()),
    );

    const trimmedRefresh = refreshToken?.trim();
    if (trimmedRefresh) {
      await this.tokenRevocation.revoke(
        trimmedRefresh,
        this.remainingTtlSec(trimmedRefresh, this.refreshFallbackTtlSec()),
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { authProvider: true },
    });

    await this.auditActions.authLogout(userId, {
      authProvider: user?.authProvider,
      refreshTokenRevoked: Boolean(trimmedRefresh),
    });
  }

  private remainingTtlSec(token: string, fallbackSec: number): number {
    const decoded = this.jwtService.decode(token);
    if (decoded?.exp) {
      return Math.max(decoded.exp - Math.floor(Date.now() / 1000), 1);
    }
    return fallbackSec;
  }

  private accessFallbackTtlSec(): number {
    return getJwtAccessExpiresInSeconds();
  }

  private refreshFallbackTtlSec(): number {
    return getJwtRefreshExpiresInSeconds();
  }
}
