import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { bumpAdminUsersCacheGeneration } from "../../../admin/user/config/admin-users-cache.config";
import { AuditActionsService } from "../../../audit-trails/recorder/services/audit-actions.service";
import { translate, type Locale } from "../../../common/i18n";
import { validationErrorResponse } from "../../../common/utils/response.util";
import { PrismaService } from "../../../prisma/prisma.service";
import { getJwtAccessExpiresInSeconds } from "../../session/config/jwt-expiry.config";
import { AuthTokenRevocationStore } from "../../session/services/auth-token-revocation.store";

type JwtExpPayload = { exp?: number };

@Injectable()
export class DeactivateAccountService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly tokenRevocation: AuthTokenRevocationStore,
    private readonly auditActions: AuditActionsService,
  ) {}

  async deactivate(
    userId: string,
    accessToken: string,
    locale: Locale,
  ): Promise<void> {
    if (!accessToken.trim()) {
      throw new UnauthorizedException(translate(locale, "tokenMissing"));
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isActive: true,
        deletedAt: true,
        authProvider: true,
      },
    });
    if (!user || user.deletedAt) {
      throw new NotFoundException(translate(locale, "userNotFound"));
    }
    if (!user.isActive) {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, "accountAlreadyInactive")],
          undefined,
          locale,
        ),
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    await this.tokenRevocation.revoke(
      accessToken,
      this.remainingTtlSec(accessToken, getJwtAccessExpiresInSeconds()),
    );

    bumpAdminUsersCacheGeneration();

    await this.auditActions.authAccountDeactivate(userId, {
      authProvider: user.authProvider,
    });
  }

  private remainingTtlSec(token: string, fallbackSec: number): number {
    const decoded = this.jwtService.decode<JwtExpPayload>(token);
    if (decoded?.exp) {
      return Math.max(decoded.exp - Math.floor(Date.now() / 1000), 1);
    }
    return fallbackSec;
  }
}
