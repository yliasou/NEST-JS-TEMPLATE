import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { translate, type Locale } from "../../../common/i18n";
import { validationErrorResponse } from "../../../common/utils/response.util";
import type { AuthOtpStarted } from "../../otp";
import { AuthOtpService } from "../../otp/services/auth-otp.service";

@Injectable()
export class AuthEmailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authOtp: AuthOtpService,
  ) {}

  /** Renvoie un code de vérification à l'e-mail du compte connecté. */
  async resendVerification(
    userId: string,
    locale: Locale,
  ): Promise<AuthOtpStarted> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerifiedAt: true, deletedAt: true },
    });
    if (!user || user.deletedAt) {
      throw new NotFoundException(translate(locale, "userNotFound"));
    }
    if (!user.email) {
      throw this.invalid("emailMissing", locale);
    }
    if (user.emailVerifiedAt) {
      throw this.invalid("emailAlreadyVerified", locale);
    }
    return this.authOtp.beginEmailVerification(
      { id: user.id, email: user.email },
      locale,
    );
  }

  private invalid(
    key: "emailMissing" | "emailAlreadyVerified",
    locale: Locale,
  ) {
    return new UnprocessableEntityException(
      validationErrorResponse([translate(locale, key)], undefined, locale),
    );
  }
}
