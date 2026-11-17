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
   * Toujours `false` : l'ancien mode legacy (admin sans metadata = tous les droits)
   * a été retiré. Conservé pour compatibilité de réponse API.
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
