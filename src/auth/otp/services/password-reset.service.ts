import * as bcrypt from "bcrypt";
import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { translate, type Locale } from "../../../common/i18n";
import { validationErrorResponse } from "../../../common/utils/response.util";
import { AuthVerifyFlow } from "../enums/auth-verify-flow.enum";
import { userWhereByIdentifier } from "../utils/auth-identifier.util";
import { AUTH_OTP_BCRYPT_ROUNDS } from "../constants/otp.constants";
import { AuthOtpStore } from "../store/auth-otp.store";
import type {
  AuthIdentifier,
  AuthOtpStarted,
  PasswordResetPending,
} from "../types";

@Injectable()
export class AuthOtpPasswordResetService {
  constructor(
    private readonly store: AuthOtpStore,
    private readonly prisma: PrismaService,
  ) {}

  /** Envoie un code de réinitialisation sur le canal de l'identifiant (SMS ou e-mail). */
  async beginPasswordReset(
    identifier: AuthIdentifier,
    locale: Locale,
  ): Promise<AuthOtpStarted> {
    const user = await this.prisma.user.findUnique({
      where: userWhereByIdentifier(identifier),
      select: { id: true },
    });
    if (!user) {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, "passwordResetAccountNotFound")],
          undefined,
          locale,
        ),
      );
    }
    const pending: PasswordResetPending = {
      request_type: AuthVerifyFlow.PASSWORD_RESET,
      channel: identifier.channel,
      identifier: identifier.value,
      userId: user.id,
    };
    return this.store.issueOtp(identifier, pending, locale, "PWD_RESET");
  }

  /** Parcours téléphone : nouveau mot de passe après verify-code (jeton déjà validé). */
  async applyPasswordChange(
    security: string,
    newPassword: string,
    locale: Locale,
  ): Promise<void> {
    const pending = (await this.store.loadPending(
      security,
      locale,
      "passwordResetTokenInvalid",
    )) as PasswordResetPending;

    if (
      pending.request_type !== AuthVerifyFlow.PASSWORD_RESET ||
      pending.channel !== "phone" ||
      !pending.otpVerified ||
      !pending.userId
    ) {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, "passwordResetTokenInvalid")],
          undefined,
          locale,
        ),
      );
    }

    await this.store.deletePending(security, locale);
    await this.updatePassword(pending.userId, newPassword);
  }

  /** Parcours e-mail : code reçu par e-mail + nouveau mot de passe en une étape. */
  async resetWithEmailCode(
    security: string,
    code: string,
    newPassword: string,
    locale: Locale,
  ): Promise<void> {
    const pending = (await this.store.validateOtpAndGetPending(
      security,
      code,
      locale,
      { channel: "email", requestTypes: [AuthVerifyFlow.PASSWORD_RESET] },
    )) as PasswordResetPending;

    await this.store.deletePending(security, locale);
    await this.updatePassword(pending.userId, newPassword);
  }

  private async updatePassword(
    userId: string,
    newPassword: string,
  ): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, AUTH_OTP_BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
