/**
 * Catalogue des permissions backoffice.
 * Format : module.sousModule.action
 */

export const ADMIN_PERMISSIONS = {
  // Administration — Utilisateurs
  USERS_VIEW: "admin.users.view",
  USERS_CREATE: "admin.users.create",
  USERS_UPDATE: "admin.users.update",
  USERS_DELETE: "admin.users.delete",
  USERS_TOGGLE_STATUS: "admin.users.toggle_status",
  USERS_RESET_PASSWORD: "admin.users.reset_password",
  USERS_PERMANENT_OTP: "admin.users.permanent_otp",
  USERS_CONNECTED_VIEW: "admin.users.connected_view",

  // Administration — Accès & privilèges
  ACCESS_VIEW: "admin.access.view",
  ACCESS_UPDATE: "admin.access.update",
  ACCESS_RESET: "admin.access.reset",
  ACCESS_ASSIGN_TEMPLATE: "admin.access.assign_template",

  // Administration — Audit trail
  AUDIT_VIEW: "admin.audit.view",
  AUDIT_EXPORT: "admin.audit.export",

  // Administration — Configuration
  SETTINGS_VIEW: "admin.settings.view",
  SETTINGS_UPDATE: "admin.settings.update",
} as const;

export const MARKETING_PERMISSIONS = {
  NOTIFICATIONS_VIEW: "marketing.notifications.view",
  NOTIFICATIONS_SEND: "marketing.notifications.send",
  NEWSLETTER_VIEW: "marketing.newsletter.view",
  NEWSLETTER_UPDATE: "marketing.newsletter.update",
  ANNONCES_VIEW: "marketing.annonces.view",
  ANNONCES_CREATE: "marketing.annonces.create",
  ANNONCES_UPDATE: "marketing.annonces.update",
} as const;

/** Module d'exemple : à remplacer par les permissions du domaine. */
export const EXAMPLES_PERMISSIONS = {
  VIEW: "examples.examples.view",
  CREATE: "examples.examples.create",
  UPDATE: "examples.examples.update",
  DELETE: "examples.examples.delete",
} as const;

export const PEOPLE_PERMISSIONS = {
  VIEW: "people.people.view",
  CREATE: "people.people.create",
  UPDATE: "people.people.update",
  DELETE: "people.people.delete",
} as const;

export const ALL_PERMISSION_KEYS = [
  ...Object.values(ADMIN_PERMISSIONS),
  ...Object.values(MARKETING_PERMISSIONS),
  ...Object.values(EXAMPLES_PERMISSIONS),
  ...Object.values(PEOPLE_PERMISSIONS),
] as const;

export type PermissionKey = (typeof ALL_PERMISSION_KEYS)[number];

export const PERMISSION_KEY_SET = new Set<string>(ALL_PERMISSION_KEYS);

export function isKnownPermission(key: string): key is PermissionKey {
  return PERMISSION_KEY_SET.has(key);
}

export type PermissionCatalogGroup = {
  module: string;
  subModule: string;
  permissions: Array<{
    key: PermissionKey;
    action: string;
  }>;
};

function groupFrom(
  module: string,
  subModule: string,
  keys: readonly PermissionKey[],
): PermissionCatalogGroup {
  return {
    module,
    subModule,
    permissions: keys.map((key) => ({
      key,
      action: key.split(".").pop() ?? key,
    })),
  };
}

/** Catalogue regroupé pour GET /admin/access/permissions */
export function getPermissionsCatalog(): PermissionCatalogGroup[] {
  return [
    groupFrom("admin", "users", [
      ADMIN_PERMISSIONS.USERS_VIEW,
      ADMIN_PERMISSIONS.USERS_CREATE,
      ADMIN_PERMISSIONS.USERS_UPDATE,
      ADMIN_PERMISSIONS.USERS_DELETE,
      ADMIN_PERMISSIONS.USERS_TOGGLE_STATUS,
      ADMIN_PERMISSIONS.USERS_RESET_PASSWORD,
      ADMIN_PERMISSIONS.USERS_PERMANENT_OTP,
      ADMIN_PERMISSIONS.USERS_CONNECTED_VIEW,
    ]),
    groupFrom("admin", "access", [
      ADMIN_PERMISSIONS.ACCESS_VIEW,
      ADMIN_PERMISSIONS.ACCESS_UPDATE,
      ADMIN_PERMISSIONS.ACCESS_RESET,
      ADMIN_PERMISSIONS.ACCESS_ASSIGN_TEMPLATE,
    ]),
    groupFrom("admin", "audit", [
      ADMIN_PERMISSIONS.AUDIT_VIEW,
      ADMIN_PERMISSIONS.AUDIT_EXPORT,
    ]),
    groupFrom("admin", "settings", [
      ADMIN_PERMISSIONS.SETTINGS_VIEW,
      ADMIN_PERMISSIONS.SETTINGS_UPDATE,
    ]),
    groupFrom("marketing", "notifications", [
      MARKETING_PERMISSIONS.NOTIFICATIONS_VIEW,
      MARKETING_PERMISSIONS.NOTIFICATIONS_SEND,
    ]),
    groupFrom("marketing", "newsletter", [
      MARKETING_PERMISSIONS.NEWSLETTER_VIEW,
      MARKETING_PERMISSIONS.NEWSLETTER_UPDATE,
    ]),
    groupFrom("marketing", "annonces", [
      MARKETING_PERMISSIONS.ANNONCES_VIEW,
      MARKETING_PERMISSIONS.ANNONCES_CREATE,
      MARKETING_PERMISSIONS.ANNONCES_UPDATE,
    ]),
    groupFrom("examples", "examples", [
      EXAMPLES_PERMISSIONS.VIEW,
      EXAMPLES_PERMISSIONS.CREATE,
      EXAMPLES_PERMISSIONS.UPDATE,
      EXAMPLES_PERMISSIONS.DELETE,
    ]),
    groupFrom("people", "people", [
      PEOPLE_PERMISSIONS.VIEW,
      PEOPLE_PERMISSIONS.CREATE,
      PEOPLE_PERMISSIONS.UPDATE,
      PEOPLE_PERMISSIONS.DELETE,
    ]),
  ];
}

export function permissionsMapFromKeys(
  keys: readonly string[],
  granted = true,
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const key of keys) {
    map[key] = granted;
  }
  return map;
}

export function allPermissionsGrantedMap(): Record<string, boolean> {
  return permissionsMapFromKeys(ALL_PERMISSION_KEYS, true);
}
