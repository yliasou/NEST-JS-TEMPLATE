import { AuthVerifyFlow } from "../enums/auth-verify-flow.enum";
import type {
  AuthOtpPending,
  IdentifierVerificationPending,
  SendCodePending,
} from "./pending.types";

export function isExistingAccountPending(
  pending: AuthOtpPending,
): pending is SendCodePending {
  return pending.request_type === AuthVerifyFlow.EXISTING_ACCOUNT;
}

export function isIdentifierVerificationPending(
  pending: AuthOtpPending,
): pending is IdentifierVerificationPending {
  return pending.request_type === AuthVerifyFlow.NEW_ACCOUNT;
}
