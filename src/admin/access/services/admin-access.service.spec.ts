import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { AdminLevel, Role } from "@prisma/client";
import { AdminAccessService } from "./admin-access.service";

function createService(prisma: any, auditActions: any = {}) {
  return new AdminAccessService(prisma, auditActions);
}

describe("AdminAccessService", () => {
  const actorId = "actor-1";
  const targetId = "target-1";

  function userRow(overrides: Record<string, unknown> = {}) {
    return {
      id: actorId,
      role: Role.ADMIN,
      isActive: true,
      deletedAt: null,
      adminProfile: {
        level: AdminLevel.ADMIN,
        metadata: null,
      },
      ...overrides,
    };
  }

  describe("hasPermission / getEffectiveAccess", () => {
    it("refuse tout droit quand aucune metadata.access (plus de legacy)", async () => {
      const prisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue(userRow()),
        },
      };
      const service = createService(prisma);
      await expect(
        service.hasPermission(actorId, "admin.users.view"),
      ).resolves.toBe(false);
      const access = await service.getEffectiveAccess(actorId);
      expect(access.legacyFullAccess).toBe(false);
      expect(access.isSuperAdmin).toBe(false);
      expect(access.permissions).toEqual([]);
    });

    it("autorise un super admin explicite", async () => {
      const prisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue(
            userRow({
              adminProfile: {
                level: AdminLevel.EMPLOYEE,
                metadata: {
                  access: {
                    isSuperAdmin: true,
                    permissions: {},
                  },
                },
              },
            }),
          ),
        },
      };
      const service = createService(prisma);
      await expect(
        service.hasPermission(actorId, "admin.access.update"),
      ).resolves.toBe(true);
    });

    it("refuse une permission absente", async () => {
      const prisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue(
            userRow({
              adminProfile: {
                level: AdminLevel.EMPLOYEE,
                metadata: {
                  access: {
                    isSuperAdmin: false,
                    permissions: {
                      "admin.users.view": true,
                    },
                  },
                },
              },
            }),
          ),
        },
      };
      const service = createService(prisma);
      await expect(
        service.hasPermission(actorId, "admin.users.create"),
      ).resolves.toBe(false);
      await expect(
        service.hasPermission(actorId, "admin.users.view"),
      ).resolves.toBe(true);
    });

    it("refuse une permission inconnue", async () => {
      const prisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue(userRow()),
        },
      };
      const service = createService(prisma);
      await expect(
        service.hasPermission(actorId, "unknown.permission"),
      ).resolves.toBe(false);
    });

    it("refuse un utilisateur inactif", async () => {
      const prisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue(userRow({ isActive: false })),
        },
      };
      const service = createService(prisma);
      await expect(service.getEffectiveAccess(actorId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe("updateUserAccess security", () => {
    it("empêche de modifier ses propres droits", async () => {
      const prisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue(userRow()),
        },
      };
      const service = createService(prisma);
      await expect(
        service.updateUserAccess(actorId, actorId, {
          permissions: { "admin.users.view": true },
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("empêche d’accorder une permission non possédée", async () => {
      const actor = userRow({
        id: actorId,
        adminProfile: {
          level: AdminLevel.EMPLOYEE,
          metadata: {
            access: {
              isSuperAdmin: false,
              permissions: {
                "admin.access.update": true,
                "admin.users.view": true,
              },
            },
          },
        },
      });
      const target = userRow({
        id: targetId,
        adminProfile: {
          level: AdminLevel.EMPLOYEE,
          metadata: {
            access: {
              isSuperAdmin: false,
              permissions: {},
            },
          },
        },
      });
      const prisma = {
        user: {
          findUnique: jest
            .fn()
            .mockImplementation(({ where }: { where: { id: string } }) => {
              if (where.id === actorId) return Promise.resolve(actor);
              if (where.id === targetId) return Promise.resolve(target);
              return Promise.resolve(null);
            }),
        },
        adminProfile: {
          update: jest.fn(),
        },
      };
      const service = createService(prisma, {
        adminAccessUpdate: jest.fn(),
        adminUserPermissionChange: jest.fn(),
        adminSuperAdminChange: jest.fn(),
      });

      await expect(
        service.updateUserAccess(actorId, targetId, {
          permissions: { "admin.users.create": true },
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("rejette une permission inconnue à l’écriture", async () => {
      const actor = userRow({
        adminProfile: {
          level: AdminLevel.ADMIN,
          metadata: {
            access: { isSuperAdmin: true, permissions: {} },
          },
        },
      });
      const target = userRow({
        id: targetId,
        adminProfile: {
          level: AdminLevel.EMPLOYEE,
          metadata: {
            access: { isSuperAdmin: false, permissions: {} },
          },
        },
      });
      const prisma = {
        user: {
          findUnique: jest
            .fn()
            .mockImplementation(({ where }: { where: { id: string } }) => {
              if (where.id === actorId) return Promise.resolve(actor);
              if (where.id === targetId) return Promise.resolve(target);
              return Promise.resolve(null);
            }),
        },
      };
      const service = createService(prisma);
      await expect(
        service.updateUserAccess(actorId, targetId, {
          permissions: { "not.a.real.permission": true },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("getPermissionsCatalog", () => {
    it("retourne le catalogue et les templates", () => {
      const service = createService({});
      const data = service.getPermissionsCatalog();
      expect(data.catalog.length).toBeGreaterThan(0);
      expect(data.templates.some((t) => t.id === "SUPER_ADMIN")).toBe(true);
      expect(data.keys).toContain("admin.access.update");
    });
  });
});
