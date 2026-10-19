import {
  extractAccessPayload,
  grantedPermissionKeys,
  mergeAccessPayload,
  parseAdminProfileMetadata,
} from "./access-metadata.util";

describe("access-metadata.util", () => {
  describe("parseAdminProfileMetadata", () => {
    it("retourne {} pour metadata null sans planter", () => {
      expect(parseAdminProfileMetadata(null)).toEqual({});
      expect(parseAdminProfileMetadata(undefined)).toEqual({});
    });

    it("ignore une metadata non-objet sans planter (mode soft)", () => {
      expect(parseAdminProfileMetadata("invalid")).toEqual({});
      expect(parseAdminProfileMetadata([1, 2])).toEqual({});
    });

    it("parse un access valide", () => {
      const parsed = parseAdminProfileMetadata({
        access: {
          isSuperAdmin: false,
          permissions: {
            "admin.users.view": true,
            "admin.users.create": false,
          },
        },
      });
      expect(parsed.access?.isSuperAdmin).toBe(false);
      expect(parsed.access?.permissions["admin.users.view"]).toBe(true);
    });

    it("rejette une permission inconnue en mode strict", () => {
      expect(() =>
        parseAdminProfileMetadata(
          {
            access: {
              isSuperAdmin: false,
              permissions: { "unknown.permission": true },
            },
          },
          { strict: true, locale: "fr" },
        ),
      ).toThrow();
    });

    it("ignore une permission inconnue en mode soft", () => {
      const parsed = parseAdminProfileMetadata({
        access: {
          permissions: {
            "admin.users.view": true,
            "unknown.permission": true,
          },
        },
      });
      expect(parsed.access?.permissions["admin.users.view"]).toBe(true);
      expect(parsed.access?.permissions["unknown.permission"]).toBeUndefined();
    });
  });

  describe("mergeAccessPayload", () => {
    it("fusionne les permissions", () => {
      const merged = mergeAccessPayload(
        {
          isSuperAdmin: false,
          permissions: { "admin.users.view": true },
        },
        {
          permissions: { "admin.users.create": true },
        },
      );
      expect(merged.permissions["admin.users.view"]).toBe(true);
      expect(merged.permissions["admin.users.create"]).toBe(true);
    });
  });

  describe("grantedPermissionKeys", () => {
    it("ne retourne que les permissions true", () => {
      expect(
        grantedPermissionKeys({
          "admin.users.view": true,
          "admin.users.create": false,
        }),
      ).toEqual(["admin.users.view"]);
    });
  });

  describe("extractAccessPayload", () => {
    it("retourne null si access absent", () => {
      expect(extractAccessPayload({ other: 1 })).toBeNull();
    });
  });
});
