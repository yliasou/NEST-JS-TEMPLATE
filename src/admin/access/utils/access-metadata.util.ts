import { BadRequestException } from "@nestjs/common";
import type { Locale } from "../../../common/i18n";
import { translate } from "../../../common/i18n";
import { isKnownPermission } from "../constants/permissions.catalog";
import {
  emptyAccessPayload,
  type AdminAccessPayload,
  type AdminProfileMetadata,
} from "../types/access-metadata.types";

function parsePermissionsMap(
  raw: unknown,
  locale: Locale,
  strict: boolean,
): Record<string, boolean> {
  if (raw == null) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) {
    if (strict) {
      throw new BadRequestException(
        translate(locale, "adminAccessInvalidMetadata"),
      );
    }
    return {};
  }

  const result: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== "boolean") {
      if (strict) {
        throw new BadRequestException(
          translate(locale, "adminAccessInvalidMetadata"),
        );
      }
      continue;
    }
    if (!isKnownPermission(key)) {
      if (strict) {
        throw new BadRequestException(
          translate(locale, "adminAccessUnknownPermission", { key }),
        );
      }
      continue;
    }
    result[key] = value;
  }
  return result;
}

/**
 * Lit metadata JSON sans faire planter l’app si le JSON est mal formé.
 * En mode strict (écriture), rejette les permissions inconnues / structures invalides.
 */
export function parseAdminProfileMetadata(
  metadata: unknown,
  options?: { locale?: Locale; strict?: boolean },
): AdminProfileMetadata {
  const locale = options?.locale ?? "fr";
  const strict = options?.strict ?? false;

  if (metadata == null) {
    return {};
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    if (strict) {
      throw new BadRequestException(
        translate(locale, "adminAccessInvalidMetadata"),
      );
    }
    return {};
  }

  const root = { ...(metadata as Record<string, unknown>) };
  const accessRaw = root.access;

  if (accessRaw == null) {
    return root as AdminProfileMetadata;
  }

  if (typeof accessRaw !== "object" || Array.isArray(accessRaw)) {
    if (strict) {
      throw new BadRequestException(
        translate(locale, "adminAccessInvalidMetadata"),
      );
    }
    const { access: _ignored, ...rest } = root;
    return rest as AdminProfileMetadata;
  }

  const accessObj = accessRaw as Record<string, unknown>;
  const access: AdminAccessPayload = {
    isSuperAdmin: accessObj.isSuperAdmin === true,
    permissions: parsePermissionsMap(accessObj.permissions, locale, strict),
  };

  return { ...root, access };
}

export function extractAccessPayload(
  metadata: unknown,
  options?: { locale?: Locale; strict?: boolean },
): AdminAccessPayload | null {
  const parsed = parseAdminProfileMetadata(metadata, options);
  return parsed.access ?? null;
}

export function mergeAccessPayload(
  current: AdminAccessPayload | null,
  patch: {
    isSuperAdmin?: boolean;
    permissions?: Record<string, boolean>;
  },
): AdminAccessPayload {
  const base = current ?? emptyAccessPayload();
  const next: AdminAccessPayload = {
    isSuperAdmin:
      patch.isSuperAdmin !== undefined ? patch.isSuperAdmin : base.isSuperAdmin,
    permissions: {
      ...base.permissions,
      ...(patch.permissions ?? {}),
    },
  };
  return next;
}

export function grantedPermissionKeys(
  permissions: Record<string, boolean>,
): string[] {
  return Object.entries(permissions)
    .filter(([, granted]) => granted === true)
    .map(([key]) => key)
    .sort();
}
