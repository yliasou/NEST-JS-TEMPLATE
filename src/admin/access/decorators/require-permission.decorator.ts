import { SetMetadata } from "@nestjs/common";

export const REQUIRE_PERMISSIONS_KEY = "require_permissions";

export type RequirePermissionsMode = "all" | "any";

export type RequirePermissionsMeta = {
  permissions: string[];
  mode: RequirePermissionsMode;
};

/**
 * Exige une permission granulaire backoffice.
 * @example `@RequirePermission('admin.users.view')`
 */
export const RequirePermission = (permission: string) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, {
    permissions: [permission],
    mode: "all",
  } satisfies RequirePermissionsMeta);

/**
 * Exige une ou plusieurs permissions.
 * @example `@RequirePermissions(['admin.users.view', 'admin.users.create'])`
 * @example `@RequirePermissions(['a', 'b'], 'any')`
 */
export const RequirePermissions = (
  permissions: string[],
  mode: RequirePermissionsMode = "all",
) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, {
    permissions,
    mode,
  } satisfies RequirePermissionsMeta);
