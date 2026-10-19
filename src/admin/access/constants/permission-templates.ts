import {
  ADMIN_PERMISSIONS,
  MARKETING_PERMISSIONS,
  allPermissionsGrantedMap,
  permissionsMapFromKeys,
} from "./permissions.catalog";
import type { AdminAccessPayload } from "../types/access-metadata.types";

export const ACCESS_TEMPLATE_IDS = [
  "SUPER_ADMIN",
  "USER_MANAGER",
  "MARKETING_MANAGER",
] as const;

export type AccessTemplateId = (typeof ACCESS_TEMPLATE_IDS)[number];

export type AccessTemplateDefinition = {
  id: AccessTemplateId;
  label: string;
  description: string;
  isSuperAdmin: boolean;
  permissions: Record<string, boolean>;
};

export const ACCESS_TEMPLATES: Record<
  AccessTemplateId,
  AccessTemplateDefinition
> = {
  SUPER_ADMIN: {
    id: "SUPER_ADMIN",
    label: "Super admin",
    description: "Accès complet à tous les modules backoffice.",
    isSuperAdmin: true,
    permissions: allPermissionsGrantedMap(),
  },
  USER_MANAGER: {
    id: "USER_MANAGER",
    label: "Gestionnaire utilisateurs",
    description: "Consultation et gestion des comptes utilisateurs.",
    isSuperAdmin: false,
    permissions: permissionsMapFromKeys(
      [
        ADMIN_PERMISSIONS.USERS_VIEW,
        ADMIN_PERMISSIONS.USERS_CREATE,
        ADMIN_PERMISSIONS.USERS_UPDATE,
        ADMIN_PERMISSIONS.USERS_TOGGLE_STATUS,
        ADMIN_PERMISSIONS.USERS_RESET_PASSWORD,
        ADMIN_PERMISSIONS.USERS_CONNECTED_VIEW,
      ],
      true,
    ),
  },
  MARKETING_MANAGER: {
    id: "MARKETING_MANAGER",
    label: "Responsable marketing",
    description: "Notifications, newsletter et annonces.",
    isSuperAdmin: false,
    permissions: permissionsMapFromKeys(
      Object.values(MARKETING_PERMISSIONS),
      true,
    ),
  },
};

export function isAccessTemplateId(value: string): value is AccessTemplateId {
  return (ACCESS_TEMPLATE_IDS as readonly string[]).includes(value);
}

export function buildAccessFromTemplate(
  templateId: AccessTemplateId,
): AdminAccessPayload {
  const template = ACCESS_TEMPLATES[templateId];
  return {
    isSuperAdmin: template.isSuperAdmin,
    permissions: { ...template.permissions },
  };
}

/**
 * Fusionne un modèle avec les droits existants (union des permissions accordées).
 * - SUPER_ADMIN : sémantique exclusive → accès complet.
 * - Autres modèles : ajoutent leurs permissions sans retirer les droits déjà présents.
 */
export function mergeAccessFromTemplate(
  previous: AdminAccessPayload | null | undefined,
  templateId: AccessTemplateId,
): AdminAccessPayload {
  const templateAccess = buildAccessFromTemplate(templateId);
  const base = previous ?? { isSuperAdmin: false, permissions: {} };

  if (templateAccess.isSuperAdmin) {
    return {
      isSuperAdmin: true,
      permissions: { ...templateAccess.permissions },
    };
  }

  const grantedFromTemplate = Object.fromEntries(
    Object.entries(templateAccess.permissions).filter(
      ([, granted]) => granted === true,
    ),
  );

  return {
    isSuperAdmin: base.isSuperAdmin === true,
    permissions: {
      ...base.permissions,
      ...grantedFromTemplate,
    },
  };
}

export function listAccessTemplates() {
  return ACCESS_TEMPLATE_IDS.map((id) => {
    const t = ACCESS_TEMPLATES[id];
    const permissionKeys = Object.entries(t.permissions)
      .filter(([, granted]) => granted === true)
      .map(([key]) => key)
      .sort();
    return {
      id: t.id,
      label: t.label,
      description: t.description,
      isSuperAdmin: t.isSuperAdmin,
      permissionKeys,
    };
  });
}
