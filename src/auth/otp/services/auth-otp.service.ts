import { Injectable } from "@nestjs/common";
import type { Locale } from "../../../common/i18n";
import { AuthVerifyFlow } from "../enums/auth-verify-flow.enum";
import type {
  AuthIdentifier,
  AuthOtpPending,
  AuthOtpStarted,
  IdentifierVerificationPending,
} from "../types";
import { AuthOtpEmailVerificationService } from "./email-verification.service";
import { AuthOtpPasswordResetService } from "./password-reset.service";
import { AuthOtpRegistrationService } from "./registration.service";
import { AuthOtpSendCodeService } from "./send-code.service";
import { AuthOtpVerifyService } from "./verify.service";

/** Façade OTP : délègue aux services par flux. */
@Injectable()
export class AuthOtpService {
  constructor(
    private readonly sendCodeFlow: AuthOtpSendCodeService,
    private readonly passwordResetFlow: AuthOtpPasswordResetService,
    private readonly registrationFlow: AuthOtpRegistrationService,
    private readonly verifyFlow: AuthOtpVerifyService,
    private readonly emailVerificationFlow: AuthOtpEmailVerificationService,
  ) {}

  // ─── Parcours téléphone ─────────────────────────────────────

  sendCode(phoneNumber: string, locale: Locale): Promise<AuthOtpStarted> {
    return this.sendCodeFlow.sendCode(phoneNumber, locale);
  }

  verifyCode(
    security: string,
    code: string,
    locale: Locale,
  ): Promise<{ request_type: AuthVerifyFlow; pending: AuthOtpPending }> {
    return this.verifyFlow.verifyCode(security, code, locale);
  }

  consumeVerifiedPhoneForRegistration(
    security: string,
    phone: string,
    locale: Locale,
  ): Promise<IdentifierVerificationPending> {
    return this.registrationFlow.consumeVerifiedPhoneForRegistration(
      security,
      phone,
      locale,
    );
  }

  applyPasswordChange(
    security: string,
    newPassword: string,
    locale: Locale,
  ): Promise<void> {
    return this.passwordResetFlow.applyPasswordChange(
      security,
      newPassword,
      locale,
    );
  }

  // ─── Parcours e-mail ────────────────────────────────────────

  beginEmailVerification(
    user: { id: string; email: string },
    locale: Locale,
  ): Promise<AuthOtpStarted> {
    return this.emailVerificationFlow.begin(user, locale);
  }

  confirmEmailVerification(
    security: string,
    code: string,
    locale: Locale,
  ): Promise<void> {
    return this.emailVerificationFlow.confirm(security, code, locale);
  }

  resetPasswordWithEmailCode(
    security: string,
    code: string,
    newPassword: string,
    locale: Locale,
  ): Promise<void> {
    return this.passwordResetFlow.resetWithEmailCode(
      security,
      code,
      newPassword,
      locale,
    );
  }

  // ─── Commun ─────────────────────────────────────────────────

  beginPasswordReset(
    identifier: AuthIdentifier,
    locale: Locale,
  ): Promise<AuthOtpStarted> {
    return this.passwordResetFlow.beginPasswordReset(identifier, locale);
  }
}
