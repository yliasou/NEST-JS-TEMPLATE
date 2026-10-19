import { Injectable } from "@nestjs/common";
import type { Locale } from "../../../common/i18n";
import { AuthVerifyFlow } from "../enums/auth-verify-flow.enum";
import { AuthOtpStore } from "../store/auth-otp.store";
import type { AuthOtpPending } from "../types";

const PHONE_FLOWS = [
  AuthVerifyFlow.NEW_ACCOUNT,
  AuthVerifyFlow.EXISTING_ACCOUNT,
  AuthVerifyFlow.PASSWORD_RESET,
] as const;

@Injectable()
export class AuthOtpVerifyService {
  constructor(private readonly store: AuthOtpStore) {}

  /** Parcours téléphone : valide le code SMS d'un jeton send-code / forgot-password. */
  async verifyCode(
    security: string,
    code: string,
    locale: Locale,
  ): Promise<{ request_type: AuthVerifyFlow; pending: AuthOtpPending }> {
    const pending = await this.store.validateOtpAndGetPending(
      security,
      code,
      locale,
      { channel: "phone", requestTypes: PHONE_FLOWS },
    );

    if (
      pending.request_type === AuthVerifyFlow.PASSWORD_RESET ||
      pending.request_type === AuthVerifyFlow.NEW_ACCOUNT
    ) {
      const verified = { ...pending, otpVerified: true } as AuthOtpPending;
      await this.store.savePending(security, verified, locale);
      return { request_type: pending.request_type, pending: verified };
    }

    return { request_type: pending.request_type, pending };
  }
}
