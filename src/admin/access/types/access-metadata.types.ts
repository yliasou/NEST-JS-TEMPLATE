export type AdminAccessPayload = {
  isSuperAdmin: boolean;
  permissions: Record<string, boolean>;
};

/** Structure stockée dans AdminProfile.metadata */
export type AdminProfileMetadata = {
  access?: AdminAccessPayload;
  [key: string]: unknown;
};

export type EffectiveAdminAccess = {
  userId: string;
  role: string;
  adminLevel: string | null;
  isSuperAdmin: boolean;
  /**
   * true si aucune metadata.access n’est définie :
   * comportement legacy (Role.ADMIN conserve l’accès complet).
   */
  legacyFullAccess: boolean;
  permissions: string[];
  permissionsMap: Record<string, boolean>;
};

export function emptyAccessPayload(): AdminAccessPayload {
  return {
    isSuperAdmin: false,
    permissions: {},
  };
}
