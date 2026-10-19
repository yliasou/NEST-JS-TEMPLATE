import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { translate, type Locale } from "../../../common/i18n";
import { validationErrorResponse } from "../../../common/utils/response.util";
import { AuthVerifyFlow } from "../enums/auth-verify-flow.enum";
import { AuthOtpStore } from "../store/auth-otp.store";
import type { AuthOtpStarted, EmailVerificationPending } from "../types";

@Injectable()
export class AuthOtpEmailVerificationService {
  constructor(
    private readonly store: AuthOtpStore,
    private readonly prisma: PrismaService,
  ) {}

  /** Envoie un code de vérification à l'e-mail du compte. */
  async begin(
    user: { id: string; email: string },
    locale: Locale,
  ): Promise<AuthOtpStarted> {
    const pending: EmailVerificationPending = {
      request_type: AuthVerifyFlow.EMAIL_VERIFICATION,
      channel: "email",
      identifier: user.email,
      userId: user.id,
    };
    return this.store.issueOtp(
      { channel: "email", value: user.email },
      pending,
      locale,
      "EMAIL_VERIFY",
    );
  }

  /** Valide le code et marque l'e-mail comme vérifié (s'il n'a pas changé entre-temps). */
  async confirm(security: string, code: string, locale: Locale): Promise<void> {
    const pending = (await this.store.validateOtpAndGetPending(
      security,
      code,
      locale,
      { channel: "email", requestTypes: [AuthVerifyFlow.EMAIL_VERIFICATION] },
    )) as EmailVerificationPending;

    await this.store.deletePending(security, locale);

    const { count } = await this.prisma.user.updateMany({
      where: { id: pending.userId, email: pending.identifier },
      data: { emailVerifiedAt: new Date() },
    });
    if (count === 0) {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, "emailMismatchSecurity")],
          undefined,
          locale,
        ),
      );
    }
  }
}
