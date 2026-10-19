import * as bcrypt from "bcrypt";
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditActionsService } from "../../../audit-trails/recorder/services/audit-actions.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { translate, type Locale } from "../../../common/i18n";
import { validationErrorResponse } from "../../../common/utils/response.util";
import type { EmailRegisterDto } from "../../email/dto/email-register.dto";
import type { PhoneRegisterDto } from "../../phone/dto/phone-register.dto";
import type { RegisterProfileDto } from "../dto/register-profile.dto";
import { AuthResponse } from "../../session/interfaces/auth-response.interface";
import {
  normalizeOptionalText,
  parseOptionalDateOfBirth,
} from "../../../profile/utils/profile-user.util";
import { normalizeEmail } from "../../otp/utils/auth-identifier.util";
import { AuthOtpService } from "../../otp/services/auth-otp.service";
import type { AuthOtpStarted } from "../../otp";
import { AuthPhoneService } from "../../phone/services/auth-phone.service";
import { TokenService } from "../../session/services/token.service";

const BCRYPT_ROUNDS = 10;

export type EmailRegistrationResult = {
  auth: AuthResponse;
  /** Null si le code n'a pas pu être envoyé (SMTP indisponible) : utiliser resend-verification. */
  emailVerification: AuthOtpStarted | null;
};

@Injectable()
export class RegisterService {
  private readonly logger = new Logger(RegisterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authOtp: AuthOtpService,
    private readonly authPhone: AuthPhoneService,
    private readonly tokenService: TokenService,
    private readonly auditActions: AuditActionsService,
  ) {}

  /**
   * Vérifie si un e-mail est déjà associé à un compte (inscription / UX).
   */
  async checkEmailExists(
    email: string,
  ): Promise<{ email: string; exists: boolean }> {
    const normalized = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });
    return { email: normalized, exists: Boolean(existing) };
  }

  /** Parcours téléphone : finalise l'inscription après send-code + verify-code. */
  async registerWithPhone(
    dto: PhoneRegisterDto,
    locale: Locale,
  ): Promise<AuthResponse> {
    const phone = this.authPhone.normalizeRequiringDialCode(
      dto.phone_number,
      locale,
    );
    const email = normalizeEmail(dto.email);

    await this.authOtp.consumeVerifiedPhoneForRegistration(
      dto.security,
      phone,
      locale,
    );

    const user = await this.createUser(
      dto,
      { phone, email, phoneVerifiedAt: new Date() },
      dto.secret_code,
      locale,
    );
    await this.auditActions.authRegister(user.id, {
      authProvider: user.authProvider,
      method: "phone",
    });
    return this.tokenService.buildAuthResponse(user);
  }

  /**
   * Parcours e-mail : crée le compte (e-mail non vérifié) et envoie le code de vérification.
   * L'inscription réussit même si l'envoi échoue.
   */
  async registerWithEmail(
    dto: EmailRegisterDto,
    locale: Locale,
  ): Promise<EmailRegistrationResult> {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone_number
      ? this.authPhone.normalizeRequiringDialCode(dto.phone_number, locale)
      : null;

    const user = await this.createUser(
      dto,
      { phone, email },
      dto.password,
      locale,
    );
    await this.auditActions.authRegister(user.id, {
      authProvider: user.authProvider,
      method: "email",
    });

    let emailVerification: AuthOtpStarted | null = null;
    try {
      emailVerification = await this.authOtp.beginEmailVerification(
        { id: user.id, email },
        locale,
      );
    } catch (error) {
      if (!(error instanceof ServiceUnavailableException)) throw error;
      this.logger.warn(
        `Code de vérification non envoyé à l'inscription (userId=${user.id}) : ${error.message}`,
      );
    }

    return {
      auth: this.tokenService.buildAuthResponse(user),
      emailVerification,
    };
  }

  private async createUser(
    profile: RegisterProfileDto,
    identifiers: {
      phone: string | null;
      email: string | null;
      phoneVerifiedAt?: Date;
    },
    password: string,
    locale: Locale,
  ) {
    await this.assertIdentifiersAvailable(identifiers, locale);

    const data: Prisma.UserCreateInput = {
      email: identifiers.email,
      phone: identifiers.phone,
      phoneVerifiedAt: identifiers.phoneVerifiedAt ?? null,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      dateOfBirth: parseOptionalDateOfBirth(profile.date_of_birth) ?? null,
      gender: profile.gender ?? null,
      residentialAddress:
        normalizeOptionalText(profile.residential_address) ?? null,
      profile: {
        create: {
          firstName: profile.first_name.trim(),
          lastName: profile.last_name.trim(),
        },
      },
    };

    return this.prisma.user.create({
      data,
      include: { profile: true, adminProfile: true },
    });
  }

  private async assertIdentifiersAvailable(
    identifiers: { phone: string | null; email: string | null },
    locale: Locale,
  ): Promise<void> {
    const conflict = (key: "emailAlreadyUsed" | "phoneAlreadyUsed") =>
      new UnprocessableEntityException(
        validationErrorResponse([translate(locale, key)], undefined, locale),
      );

    if (identifiers.email) {
      const taken = await this.prisma.user.findUnique({
        where: { email: identifiers.email },
        select: { id: true },
      });
      if (taken) throw conflict("emailAlreadyUsed");
    }
    if (identifiers.phone) {
      const taken = await this.prisma.user.findUnique({
        where: { phone: identifiers.phone },
        select: { id: true },
      });
      if (taken) throw conflict("phoneAlreadyUsed");
    }
  }
}
