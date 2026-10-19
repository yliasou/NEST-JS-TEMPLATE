import { NotificationType, Prisma } from "@prisma/client";

export const DEFAULT_NOTIFICATION_TITLES: Record<NotificationType, string> = {
  ADMIN_BROADCAST: "Message important",
  SYSTEM: "Information",
};

function isMetadataRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/** Fusionne `title` dans metadata (persisté en base ou renvoyé en GET). */
export function withNotificationMetadataTitle(
  metadata: unknown,
  options: { type: NotificationType; title?: string },
): Record<string, unknown> {
  const base = isMetadataRecord(metadata) ? { ...metadata } : {};

  const existingTitle =
    typeof base.title === "string" && base.title.trim().length > 0
      ? base.title.trim()
      : undefined;

  const title =
    options.title?.trim() ||
    existingTitle ||
    DEFAULT_NOTIFICATION_TITLES[options.type];

  return { ...base, title };
}

/** Normalise metadata pour les réponses API (rétrocompatibilité records sans title). */
export function normalizeNotificationMetadata(
  metadata: Prisma.JsonValue | null,
  type: NotificationType,
): Prisma.JsonValue {
  return withNotificationMetadataTitle(metadata, { type }) as Prisma.JsonValue;
}
