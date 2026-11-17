import { UnprocessableEntityException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Role } from "@prisma/client";
import { TokenService } from "./token.service";

const JWT_SECRET = "test-secret-at-least-32-characters-long";

function createRevocationStore() {
  const revoked = new Set<string>();
  return {
    revoke: jest.fn(async (token: string) => {
      revoked.add(token);
    }),
    isRevoked: jest.fn(async (token: string) => revoked.has(token)),
    consume: jest.fn(async (token: string) => {
      if (revoked.has(token)) return false;
      revoked.add(token);
      return true;
    }),
  };
}

function createService(userOverrides: Record<string, unknown> = {}) {
  const jwtService = new JwtService({ secret: JWT_SECRET });
  const user = {
    id: "user-1",
    role: Role.USER,
    authProvider: "EMAIL",
    isActive: true,
    deletedAt: null,
    tokenVersion: 0,
    ...userOverrides,
  };
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue(user) },
  };
  const auditActions = { authRefreshToken: jest.fn() };
  const tokenRevocation = createRevocationStore();
  const authUserSession = { touchLastLoginAt: jest.fn() };
  const service = new TokenService(
    jwtService,
    prisma as any,
    auditActions as any,
    tokenRevocation as any,
    authUserSession as any,
  );
  return { service, jwtService, prisma, tokenRevocation };
}

describe("TokenService", () => {
  describe("signTokenPair", () => {
    it("émet des jetons distincts même dans la même seconde", () => {
      const { service } = createService();
      const a = service.signTokenPair("user-1", Role.USER);
      const b = service.signTokenPair("user-1", Role.USER);
      expect(a.refreshToken).not.toBe(b.refreshToken);
      expect(a.accessToken).not.toBe(b.accessToken);
    });
  });

  describe("refresh", () => {
    it("renvoie une nouvelle paire et refuse le rejeu de l'ancien refresh token", async () => {
      const { service } = createService();
      const { refreshToken } = service.signTokenPair("user-1", Role.USER);

      const rotated = await service.refresh(refreshToken, "fr");
      expect(rotated.refreshToken).not.toBe(refreshToken);

      await expect(service.refresh(refreshToken, "fr")).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      await expect(
        service.refresh(rotated.refreshToken, "fr"),
      ).resolves.toBeDefined();
    });

    it("n'accepte qu'un seul refresh concurrent avec le même jeton", async () => {
      const { service } = createService();
      const { refreshToken } = service.signTokenPair("user-1", Role.USER);

      const results = await Promise.allSettled([
        service.refresh(refreshToken, "fr"),
        service.refresh(refreshToken, "fr"),
      ]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    });

    it("refuse un access token présenté comme refresh token", async () => {
      const { service } = createService();
      const { accessToken } = service.signTokenPair("user-1", Role.USER);
      await expect(service.refresh(accessToken, "fr")).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it("refuse un compte désactivé", async () => {
      const { service } = createService({ isActive: false });
      const { refreshToken } = service.signTokenPair("user-1", Role.USER);
      await expect(service.refresh(refreshToken, "fr")).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });
  });

  describe("verifyAccessTokenDiagnose", () => {
    it("retourne le rôle en base, pas celui embarqué dans le JWT", async () => {
      const { service } = createService({ role: Role.USER });
      const { accessToken } = service.signTokenPair("user-1", Role.ADMIN);
      const result = await service.verifyAccessTokenDiagnose(accessToken);
      expect(result).toEqual({
        ok: true,
        user: { id: "user-1", role: Role.USER },
      });
    });
  });
});
