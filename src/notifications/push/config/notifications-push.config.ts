/** Taille max des lots FCM (sendEachForMulticast). */
export const NOTIFICATIONS_PUSH_FCM_BATCH_SIZE = 500;

export type NotificationsPushResolved =
  | { enabled: false }
  | {
      enabled: true;
      projectId: string;
      clientEmail: string;
      privateKey: string;
    };

/** Normalise une cle PME issue du .env (souvent avec \\n litteraux). */
export function normalizeFirebasePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, "\n").trim();
}

type EnvGetter = (key: string) => string | undefined;

/**
 * Active le push uniquement si les trois variables sont definies et coherentes.
 * FIREBASE_PUSH_ENABLED=false desactive explicitement meme avec des credentials.
 */
export function resolveNotificationsPushConfig(
  get: EnvGetter,
): NotificationsPushResolved {
  const toggle = get("FIREBASE_PUSH_ENABLED")?.trim().toLowerCase();
  if (toggle === "false" || toggle === "0") {
    return { enabled: false };
  }

  const projectId = get("FIREBASE_PROJECT_ID")?.trim();
  const clientEmail = get("FIREBASE_CLIENT_EMAIL")?.trim();
  const rawKey = get("FIREBASE_PRIVATE_KEY");
  const privateKey = rawKey ? normalizeFirebasePrivateKey(rawKey) : "";

  if (!projectId || !clientEmail || !privateKey) {
    return { enabled: false };
  }

  return {
    enabled: true,
    projectId,
    clientEmail,
    privateKey,
  };
}
