import { UnprocessableEntityException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type Redis from "ioredis";
import type { PrismaService } from "../../../prisma/prisma.service";
import { AuthVerifyFlow } from "../enums/auth-verify-flow.enum";
import {
  AUTH_OTP_KEY_ATTEMPTS,
  AUTH_OTP_KEY_OTP,
  AUTH_OTP_KEY_PENDING,
  AUTH_OTP_MAX_FAILED_ATTEMPTS,
} from "../constants/otp.constants";
import type { AuthOtpDeliveryService } from "../services/delivery.service";
import { AuthOtpStore } from "./auth-otp.store";

const PHONE = "+33612345678";
const KEY = `phone:${PHONE}`;
const SECURITY = "sec-1";

/** Redis en mémoire, limité aux commandes utilisées par le store. */
function createRedis(initial: Record<string, string>) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    get: jest.fn(async (key: string) => data.get(key) ?? null),
    set: jest.fn(async (key: string, value: string) => {
      data.set(key, value);
      return "OK";
    }),
    del: jest.fn(
      async (...keys: string[]) =>
        keys.filter((key) => data.delete(key)).length,
    ),
    incr: jest.fn(async (key: string) => {
      const next = (Number(data.get(key)) || 0) + 1;
      data.set(key, String(next));
      return next;
    }),
    expire: jest.fn(async () => 1),
    ttl: jest.fn(async () => 300),
    exists: jest.fn(async (key: string) => (data.has(key) ? 1 : 0)),
    pipeline: jest.fn(() => {
      const ops: Array<[string, string]> = [];
      const chain = {
        set: (key: string, value: string) => {
          ops.push([key, value]);
          return chain;
        },
        exec: jest.fn(async () => {
          for (const [key, value] of ops) data.set(key, value);
          return [];
        }),
      };
      return chain;
    }),
  };
}

function errorMessages(error: unknown): string {
  return JSON.stringify((error as UnprocessableEntityException).getResponse());
}

describe("AuthOtpStore.validateOtpAndGetPending", () => {
  const config = { get: jest.fn(() => undefined) } as unknown as ConfigService;
  const prisma = {
    user: { findUnique: jest.fn(async () => null) },
  } as unknown as PrismaService;

  function setup() {
    const redis = createRedis({
      [`${AUTH_OTP_KEY_PENDING}:${SECURITY}`]: JSON.stringify({
        channel: "phone",
        identifier: PHONE,
        request_type: AuthVerifyFlow.EXISTING_ACCOUNT,
      }),
      [`${AUTH_OTP_KEY_OTP}:${KEY}`]: "1234",
    });
    const store = new AuthOtpStore(redis as unknown as Redis, config, prisma, {
      deliver: jest.fn(),
    } as unknown as AuthOtpDeliveryService);
    return { redis, store };
  }

  it("accepts the right code and clears the failure counter", async () => {
    const { redis, store } = setup();
    redis.data.set(`${AUTH_OTP_KEY_ATTEMPTS}:${KEY}`, "2");

    await expect(
      store.validateOtpAndGetPending(SECURITY, "1234", "fr"),
    ).resolves.toMatchObject({ identifier: PHONE });
    expect(redis.data.has(`${AUTH_OTP_KEY_ATTEMPTS}:${KEY}`)).toBe(false);
  });

  it("rejects a token from another channel without counting an attempt", async () => {
    const { redis, store } = setup();

    const error = await store
      .validateOtpAndGetPending(SECURITY, "1234", "fr", { channel: "email" })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(UnprocessableEntityException);
    expect(redis.data.get(`${AUTH_OTP_KEY_OTP}:${KEY}`)).toBe("1234");
    expect(redis.data.has(`${AUTH_OTP_KEY_ATTEMPTS}:${KEY}`)).toBe(false);
  });

  it("locks the phone and burns the code after too many failures", async () => {
    const { redis, store } = setup();

    for (let i = 1; i < AUTH_OTP_MAX_FAILED_ATTEMPTS; i += 1) {
      const error = await store
        .validateOtpAndGetPending(SECURITY, "0000", "fr")
        .catch((e: unknown) => e);
      expect(errorMessages(error)).toContain("Code incorrect ou expiré");
    }

    const locked = await store
      .validateOtpAndGetPending(SECURITY, "0000", "fr")
      .catch((e: unknown) => e);
    expect(errorMessages(locked)).toContain("Trop de tentatives");
    expect(redis.data.has(`${AUTH_OTP_KEY_OTP}:${KEY}`)).toBe(false);

    const afterLock = await store
      .validateOtpAndGetPending(SECURITY, "1234", "fr")
      .catch((e: unknown) => e);
    expect(errorMessages(afterLock)).toContain("Trop de tentatives");
  });
});

describe("AuthOtpStore.issueOtp", () => {
  const config = { get: jest.fn(() => undefined) } as unknown as ConfigService;
  const prisma = {} as PrismaService;
  const EMAIL = "user@example.com";
  const pending = {
    channel: "email" as const,
    identifier: EMAIL,
    request_type: AuthVerifyFlow.NEW_ACCOUNT as const,
  };

  it("envoie le code sur le canal de l'identifiant", async () => {
    const redis = createRedis({});
    const deliver = jest.fn(async () => undefined);
    const store = new AuthOtpStore(redis as unknown as Redis, config, prisma, {
      deliver,
    } as unknown as AuthOtpDeliveryService);

    const started = await store.issueOtp(
      { channel: "email", value: EMAIL },
      pending,
      "fr",
      "TEST",
    );

    const code = redis.data.get(`${AUTH_OTP_KEY_OTP}:email:${EMAIL}`);
    expect(code).toMatch(/^\d{4}$/);
    expect(deliver).toHaveBeenCalledWith(
      { channel: "email", value: EMAIL },
      code,
      300,
      "fr",
    );
    expect(started.otp_code).toBeUndefined();
  });

  it("nettoie Redis si l'envoi échoue", async () => {
    const redis = createRedis({});
    const store = new AuthOtpStore(redis as unknown as Redis, config, prisma, {
      deliver: jest.fn(async () => {
        throw new Error("smtp down");
      }),
    } as unknown as AuthOtpDeliveryService);

    await expect(
      store.issueOtp({ channel: "email", value: EMAIL }, pending, "fr", "TEST"),
    ).rejects.toThrow("smtp down");
    expect(redis.data.size).toBe(0);
  });
});
