import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { translate, type Locale } from "../../../common/i18n";
import { EmailingService } from "../../../emailing/emailing.service";
import { generateGenericMessageEmail } from "../../../emailing/templates";
import type { AuthIdentifier } from "../types";

/**
 * Envoi du code OTP sur le canal de l'identifiant.
 * Sans fournisseur disponible, l'envoi échoue en 503, sauf si un mode dev
 * (OTP_LOG_CODE / OTP_RETURN_CODE_IN_RESPONSE) permet de récupérer le code autrement.
 */
@Injectable()
export class AuthOtpDeliveryService {
  private readonly logger = new Logger(AuthOtpDeliveryService.name);

  constructor(
    private readonly emailing: EmailingService,
    private readonly config: ConfigService,
  ) {}

  async deliver(
    identifier: AuthIdentifier,
    code: string,
    ttlSec: number,
    locale: Locale,
  ): Promise<void> {
    if (identifier.channel === "email") {
      await this.sendEmail(identifier.value, code, ttlSec, locale);
      return;
    }
    await this.sendSms(identifier.value, code, ttlSec, locale);
  }

  private async sendEmail(
    email: string,
    code: string,
    ttlSec: number,
    locale: Locale,
  ): Promise<void> {
    if (!this.emailing.isEnabled()) {
      this.handleUnavailable("email", locale);
      return;
    }
    const minutes = Math.max(1, Math.round(ttlSec / 60));
    const { subject, html, text } = generateGenericMessageEmail({
      locale,
      subject: translate(locale, "otpEmailSubject"),
      heading: translate(locale, "otpEmailHeading"),
      message: translate(locale, "otpEmailMessage", { code, minutes }),
    });
    await this.emailing.send({ to: [email], subject, html, text });
  }

  /** Point d'intégration SMS (Twilio, Vonage, Orange…) : aucun fournisseur branché par défaut. */
  private sendSms(
    _phone: string,
    _code: string,
    _ttlSec: number,
    locale: Locale,
  ): Promise<void> {
    this.handleUnavailable("sms", locale);
    return Promise.resolve();
  }

  private handleUnavailable(channel: "email" | "sms", locale: Locale): void {
    if (this.devCodeExposureEnabled()) {
      this.logger.warn(
        `Aucun fournisseur ${channel} configuré : OTP non envoyé (mode dev, code exposé via OTP_LOG_CODE / OTP_RETURN_CODE_IN_RESPONSE).`,
      );
      return;
    }
    throw new ServiceUnavailableException(
      translate(locale, "otpDeliveryUnavailable"),
    );
  }

  private devCodeExposureEnabled(): boolean {
    const enabled = (key: string) =>
      ["true", "1"].includes(
        String(this.config.get<string>(key) ?? "")
          .trim()
          .toLowerCase(),
      );
    return enabled("OTP_LOG_CODE") || enabled("OTP_RETURN_CODE_IN_RESPONSE");
  }
}
