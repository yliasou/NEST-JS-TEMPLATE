import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { translate, type Locale } from "../../../common/i18n";
import { validationErrorResponse } from "../../../common/utils/response.util";
import { AuthOtpStore } from "../store/auth-otp.store";
import {
  isIdentifierVerificationPending,
  type IdentifierVerificationPending,
} from "../types";

@Injectable()
export class AuthOtpRegistrationService {
  constructor(private readonly store: AuthOtpStore) {}

  /** Parcours téléphone : consomme le jeton du numéro vérifié (send-code + verify-code). */
  async consumeVerifiedPhoneForRegistration(
    security: string,
    phone: string,
    locale: Locale,
  ): Promise<IdentifierVerificationPending> {
    const pending = await this.store.loadPending(security, locale);

    if (
      !isIdentifierVerificationPending(pending) ||
      pending.channel !== "phone" ||
      !pending.otpVerified
    ) {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, "phoneNotVerified")],
          undefined,
          locale,
        ),
      );
    }

    if (pending.identifier !== phone) {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, "phoneMismatchSecurity")],
          undefined,
          locale,
        ),
      );
    }

    await this.store.deletePending(security, locale);
    return pending;
  }
}
