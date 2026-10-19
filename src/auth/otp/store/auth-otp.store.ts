import { randomInt, randomUUID } from "crypto";
import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import type Redis from "ioredis";
import { translate, type Locale } from "../../../common/i18n";
import type { MessageKey } from "../../../common/i18n/translate";
import { validationErrorResponse } from "../../../common/utils/response.util";
import { PrismaService } from "../../../prisma/prisma.service";
import { REDIS_OTP } from "../../../redis/redis-otp.constants";
import { AuthVerifyFlow } from "../enums/auth-verify-flow.enum";
import {
  AUTH_OTP_CODE_LENGTH,
  AUTH_OTP_KEY_ATTEMPTS,
  AUTH_OTP_KEY_OTP,
  AUTH_OTP_KEY_PENDING,
  AUTH_OTP_KEY_RESEND,
  AUTH_OTP_LOCK_WINDOW_SEC,
  AUTH_OTP_MAX_FAILED_ATTEMPTS,
} from "../constants/otp.constants";
import {
  identifierKey,
  userWhereByIdentifier,
} from "../utils/auth-identifier.util";
import { AuthOtpDeliveryService } from "../services/delivery.service";
import type {
  AuthIdentifier,
  AuthOtpChannel,
  AuthOtpPending,
  AuthOtpStarted,
} from "../types";
import { parsePositiveInt, timingSafeEqualString } from "../utils/otp.util";

@Injectable()
export class AuthOtpStore {
  private readonly logger = new Logger(AuthOtpStore.name);

  constructor(
    @Inject(REDIS_OTP) private readonly redis: Redis | null,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly delivery: AuthOtpDeliveryService,
  ) {}

  requireRedis(locale: Locale): Redis {
    if (!this.redis) {
      throw new ServiceUnavailableException(
        translate(locale, "otpRedisUnavailable"),
      );
    }
    return this.redis;
  }

  otpTtlSec(): number {
    return parsePositiveInt(this.config.get<string>("OTP_TTL_SEC"), 300);
  }

  resendCooldownSec(): number {
    return parsePositiveInt(
      this.config.get<string>("OTP_RESEND_COOLDOWN_SEC"),
      60,
    );
  }

  pendingKey(security: string): string {
    return `${AUTH_OTP_KEY_PENDING}:${security.trim()}`;
  }

  async loadPending(
    security: string,
    locale: Locale,
    invalidMessageKey: MessageKey = "verificationTokenInvalid",
  ): Promise<AuthOtpPending> {
    const r = this.requireRedis(locale);
    const raw = await r.get(this.pendingKey(security));
    if (!raw) {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, invalidMessageKey)],
          undefined,
          locale,
        ),
      );
    }

    try {
      const pending = JSON.parse(raw) as AuthOtpPending;
      if (!pending?.request_type || !pending?.channel || !pending?.identifier) {
        throw new Error("invalid shape");
      }
      return pending;
    } catch {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, invalidMessageKey)],
          undefined,
          locale,
        ),
      );
    }
  }

  async savePending(
    security: string,
    pending: AuthOtpPending,
    locale: Locale,
  ): Promise<void> {
    const r = this.requireRedis(locale);
    await r.set(
      this.pendingKey(security),
      JSON.stringify(pending),
      "EX",
      this.otpTtlSec(),
    );
  }

  async deletePending(security: string, locale: Locale): Promise<void> {
    const r = this.requireRedis(locale);
    await r.del(this.pendingKey(security));
  }

  async issueOtp(
    identifier: AuthIdentifier,
    pending: AuthOtpPending,
    locale: Locale,
    logLabel: string,
  ): Promise<AuthOtpStarted> {
    const r = this.requireRedis(locale);
    const key = identifierKey(identifier);
    const resendKey = `${AUTH_OTP_KEY_RESEND}:${key}`;
    if ((await r.exists(resendKey)) === 1) {
      throw new UnprocessableEntityException(
        validationErrorResponse(
          [translate(locale, "otpResendTooSoon")],
          undefined,
          locale,
        ),
      );
    }

    const otpTtl = this.otpTtlSec();
    const security = randomUUID();
    const code = String(randomInt(0, 10 ** AUTH_OTP_CODE_LENGTH)).padStart(
      AUTH_OTP_CODE_LENGTH,
      "0",
    );

    const otpKey = `${AUTH_OTP_KEY_OTP}:${key}`;

    await r
      .pipeline()
      .set(this.pendingKey(security), JSON.stringify(pending), "EX", otpTtl)
      .set(otpKey, code, "EX", otpTtl)
      .set(resendKey, "1", "EX", this.resendCooldownSec())
      .exec();

    if (this.config.get<string>("OTP_LOG_CODE", "false") === "true") {
      this.logger.warn(
        `[OTP dev ${logLabel}] ${key} code=${code} security=${security}`,
      );
    }

    try {
      await this.delivery.deliver(identifier, code, otpTtl, locale);
    } catch (error) {
      await r.del(this.pendingKey(security), otpKey, resendKey);
      throw error;
    }

    const exposeCode =
      this.config.get<string>("OTP_RETURN_CODE_IN_RESPONSE", "false") ===
      "true";
    const base = { request_type: pending.request_type, security };
    return exposeCode ? { ...base, otp_code: code } : base;
  }

  /**
   * Vérifie le code du jeton `security`. `scope` restreint le canal et le flux
   * acceptés : un jeton d'un autre parcours est refusé sans consommer de tentative.
   */
  async validateOtpAndGetPending(
    security: string,
    code: string,
    locale: Locale,
    scope?: {
      channel?: AuthOtpChannel;
      requestTypes?: readonly AuthVerifyFlow[];
    },
  ): Promise<AuthOtpPending> {
    const pending = await this.loadPending(security, locale);
    if (
      (scope?.channel && pending.channel !== scope.channel) ||
      (scope?.requestTypes &&
        !scope.requestTypes.includes(pending.request_type))
    ) {
      throw this.otpError("verificationTokenInvalid", locale);
    }
    const r = this.requireRedis(locale);
    const identifier: AuthIdentifier = {
      channel: pending.channel,
      value: pending.identifier,
    };
    const key = identifierKey(identifier);
    const otpKey = `${AUTH_OTP_KEY_OTP}:${key}`;
    const attemptsKey = `${AUTH_OTP_KEY_ATTEMPTS}:${key}`;

    const failedAttempts = Number(await r.get(attemptsKey)) || 0;
    if (failedAttempts >= AUTH_OTP_MAX_FAILED_ATTEMPTS) {
      throw this.otpError("otpTooManyAttempts", locale);
    }

    const expected = await r.get(otpKey);
    const oneTimeMatch = Boolean(
      expected && timingSafeEqualString(expected.trim(), code.trim()),
    );
    const permanentMatch =
      !oneTimeMatch && (await this.matchesPermanentOtp(identifier, code));

    if (!oneTimeMatch && !permanentMatch) {
      const failures = await r.incr(attemptsKey);
      if (failures === 1) {
        await r.expire(attemptsKey, AUTH_OTP_LOCK_WINDOW_SEC);
      }
      if (failures >= AUTH_OTP_MAX_FAILED_ATTEMPTS) {
        await r.del(otpKey);
        this.logger.warn(
          `OTP locked after ${failures} failed attempts for ${key}`,
        );
        throw this.otpError("otpTooManyAttempts", locale);
      }
      throw this.otpError("otpInvalidOrExpired", locale);
    }

    await r.del(attemptsKey);
    if (expected) {
      await r.del(otpKey);
    }

    if (pending.request_type === AuthVerifyFlow.EXISTING_ACCOUNT) {
      await this.deletePending(security, locale);
    }

    return pending;
  }

  /** OTP fixe du compte : réutilisable, non consommé à la vérification. */
  private async matchesPermanentOtp(
    identifier: AuthIdentifier,
    code: string,
  ): Promise<boolean> {
    const normalized = code.trim();
    if (
      !/^\d+$/.test(normalized) ||
      normalized.length !== AUTH_OTP_CODE_LENGTH
    ) {
      return false;
    }
    const user = await this.prisma.user.findUnique({
      where: userWhereByIdentifier(identifier),
      select: {
        permanentOtpHash: true,
        isActive: true,
        deletedAt: true,
        role: true,
      },
    });
    if (
      !user?.permanentOtpHash ||
      !user.isActive ||
      user.deletedAt ||
      user.role !== "USER"
    ) {
      return false;
    }
    return bcrypt.compare(normalized, user.permanentOtpHash);
  }

  private otpError(key: MessageKey, locale: Locale) {
    return new UnprocessableEntityException(
      validationErrorResponse([translate(locale, key)], undefined, locale),
    );
  }
}
