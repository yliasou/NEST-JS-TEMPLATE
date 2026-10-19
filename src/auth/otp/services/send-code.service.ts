import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { translate, type Locale } from "../../../common/i18n";
import { AuthVerifyFlow } from "../enums/auth-verify-flow.enum";
import { AuthPhoneService } from "../../phone/services/auth-phone.service";
import { AuthOtpStore } from "../store/auth-otp.store";
import type {
  AuthIdentifier,
  AuthOtpStarted,
  IdentifierVerificationPending,
  SendCodePending,
} from "../types";

@Injectable()
export class AuthOtpSendCodeService {
  constructor(
    private readonly store: AuthOtpStore,
    private readonly prisma: PrismaService,
    private readonly authPhone: AuthPhoneService,
  ) {}

  /**
   * Parcours téléphone : vérifie l'existence du numéro et envoie un OTP par SMS.
   * - compte existant → EXISTING_ACCOUNT
   * - numéro inconnu → NEW_ACCOUNT (étape avant register)
   */
  async sendCode(phoneNumber: string, locale: Locale): Promise<AuthOtpStarted> {
    const phone = this.authPhone.normalizeRequiringDialCode(
      phoneNumber,
      locale,
    );
    const identifier: AuthIdentifier = { channel: "phone", value: phone };
    const user = await this.prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        role: true,
        isActive: true,
        deletedAt: true,
        permanentOtpCode: true,
      },
    });

    if (user && !user.isActive) {
      throw new UnauthorizedException(translate(locale, "accountInactive"));
    }

    if (user) {
      const pending: SendCodePending = {
        request_type: AuthVerifyFlow.EXISTING_ACCOUNT,
        channel: "phone",
        identifier: phone,
        userId: user.id,
      };
      const started = await this.store.issueOtp(
        identifier,
        pending,
        locale,
        "SEND_CODE_EXISTING",
      );
      const permanentCode = String(user.permanentOtpCode || "").trim();
      if (
        user.role === Role.USER &&
        user.isActive &&
        !user.deletedAt &&
        permanentCode
      ) {
        return { ...started, otp_code: permanentCode };
      }
      return started;
    }

    const pending: IdentifierVerificationPending = {
      request_type: AuthVerifyFlow.NEW_ACCOUNT,
      channel: "phone",
      identifier: phone,
    };
    return this.store.issueOtp(identifier, pending, locale, "SEND_CODE_NEW");
  }
}
