import { AuthVerifyFlow } from "../enums/auth-verify-flow.enum";
import type { AuthOtpChannel } from "./identifier.types";

type PendingIdentifier = {
  channel: AuthOtpChannel;
  /** Téléphone E.164 ou e-mail normalisé. */
  identifier: string;
};

/** Inscription téléphone via send-code : numéro seul, avant formulaire register. */
export type IdentifierVerificationPending = PendingIdentifier & {
  request_type: AuthVerifyFlow.NEW_ACCOUNT;
  otpVerified?: boolean;
};

export type PasswordResetPending = PendingIdentifier & {
  request_type: AuthVerifyFlow.PASSWORD_RESET;
  userId: string;
  otpVerified?: boolean;
};

export type SendCodePending = PendingIdentifier & {
  request_type: AuthVerifyFlow.EXISTING_ACCOUNT;
  userId: string;
};

/** Vérification de l'e-mail d'un compte existant (inscription e-mail ou renvoi). */
export type EmailVerificationPending = PendingIdentifier & {
  request_type: AuthVerifyFlow.EMAIL_VERIFICATION;
  userId: string;
};

export type AuthOtpPending =
  | IdentifierVerificationPending
  | PasswordResetPending
  | SendCodePending
  | EmailVerificationPending;
