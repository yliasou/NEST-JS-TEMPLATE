import { Inject, Injectable, Logger } from "@nestjs/common";
import type Redis from "ioredis";
import { REDIS_KEY_PREFIX } from "../../../common/constants/app.constants";
import { REDIS_OTP } from "../../../redis/redis-otp.constants";

/** Échecs tolérés avant verrouillage (par compte, ou par identifiant si inconnu). */
export const LOGIN_MAX_FAILED_ATTEMPTS = 5;
export const LOGIN_LOCK_WINDOW_SEC = 15 * 60;

const KEY_PREFIX = `${REDIS_KEY_PREFIX}:auth:login-attempts`;

type MemoryEntry = { count: number; expiresAt: number };

/**
 * Compteur d'échecs de login anti brute-force PIN / mot de passe.
 * Préférer `user:<id>` quand le compte existe (e-mail et téléphone partagent
 * le même compteur). Repli `email:` / `phone:` si le compte est inconnu.
 * Redis quand disponible ; mémoire processus en repli (instance unique).
 */
@Injectable()
export class LoginAttemptsStore {
  private readonly logger = new Logger(LoginAttemptsStore.name);
  private readonly memory = new Map<string, MemoryEntry>();

  constructor(@Inject(REDIS_OTP) private readonly redis: Redis | null) {}

  static userKey(userId: string): string {
    return `user:${userId}`;
  }

  static emailKey(email: string): string {
    return `email:${email.trim().toLowerCase()}`;
  }

  static phoneKey(phone: string): string {
    return `phone:${phone.trim()}`;
  }

  async assertNotLocked(
    ...keys: Array<string | null | undefined>
  ): Promise<boolean> {
    for (const key of keys) {
      if (!key) continue;
      if ((await this.getFailures(key)) >= LOGIN_MAX_FAILED_ATTEMPTS) {
        return false;
      }
    }
    return true;
  }

  async recordFailure(key: string): Promise<number> {
    const storageKey = this.key(key);
    if (this.redis) {
      const failures = await this.redis.incr(storageKey);
      if (failures === 1) {
        await this.redis.expire(storageKey, LOGIN_LOCK_WINDOW_SEC);
      }
      if (failures >= LOGIN_MAX_FAILED_ATTEMPTS) {
        this.logger.warn(
          `Login locked after ${failures} failed attempts for ${this.redact(key)}`,
        );
      }
      return failures;
    }

    const now = Date.now();
    const current = this.memory.get(storageKey);
    const entry =
      current && current.expiresAt > now
        ? current
        : { count: 0, expiresAt: now + LOGIN_LOCK_WINDOW_SEC * 1000 };
    entry.count += 1;
    this.memory.set(storageKey, entry);
    if (entry.count >= LOGIN_MAX_FAILED_ATTEMPTS) {
      this.logger.warn(
        `Login locked after ${entry.count} failed attempts for ${this.redact(key)} (in-memory)`,
      );
    }
    return entry.count;
  }

  async clear(...keys: Array<string | null | undefined>): Promise<void> {
    for (const key of keys) {
      if (!key) continue;
      const storageKey = this.key(key);
      if (this.redis) {
        await this.redis.del(storageKey);
      } else {
        this.memory.delete(storageKey);
      }
    }
  }

  private async getFailures(key: string): Promise<number> {
    const storageKey = this.key(key);
    if (this.redis) {
      return Number(await this.redis.get(storageKey)) || 0;
    }
    const entry = this.memory.get(storageKey);
    if (!entry) return 0;
    if (entry.expiresAt <= Date.now()) {
      this.memory.delete(storageKey);
      return 0;
    }
    return entry.count;
  }

  private key(identifier: string): string {
    return `${KEY_PREFIX}:${identifier.trim().toLowerCase()}`;
  }

  private redact(identifier: string): string {
    if (identifier.startsWith("user:")) {
      const id = identifier.slice("user:".length);
      if (id.length <= 6) return "user:***";
      return `user:${id.slice(0, 4)}…`;
    }
    if (identifier.length <= 4) return "***";
    return `${identifier.slice(0, 2)}…${identifier.slice(-2)}`;
  }
}
