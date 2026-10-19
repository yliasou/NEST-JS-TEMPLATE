import type { ExamplesObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";
import { NotificationType, Role } from "@prisma/client";

/** Identifiants fictifs réutilisés dans les exemples Swagger (remplacer par de vrais ids en test). */
const IDS = {
  user: "clxxxxxxxxxxxxxxxxxxxxxxxx",
  actor: "cladminxxxxxxxxxxxxxxxxxxx",
  notification: "clnotifxxxxxxxxxxxxxxxxxxx",
  broadcast: "550e8400-e29b-41d4-a716-446655440000",
} as const;

/**
 * Exemples de `metadata` par `NotificationType`.
 * Ajouter une entrée par nouveau type de notification métier.
 */
export const NOTIFICATION_METADATA_SWAGGER_EXAMPLES: ExamplesObject = {
  SYSTEM: {
    summary: "SYSTEM — information applicative",
    description:
      "Notification générée par le backend (ex. fin d'un traitement).",
    value: {
      title: "Information",
      entityType: "Example",
      entityId: "clexamplexxxxxxxxxxxxxxx",
    },
  },
  ADMIN_BROADCAST: {
    summary: "ADMIN_BROADCAST — message admin (utilisateur ou rôle)",
    description:
      "Envoi unitaire : `source` + `actorUserId`. Diffusion par rôle : `broadcastId` + `role`.",
    value: {
      title: "Message important",
      source: "admin_broadcast",
      actorUserId: IDS.actor,
      broadcastId: IDS.broadcast,
      role: Role.USER,
    },
  },
};

function metadataExample(
  type: keyof typeof NOTIFICATION_METADATA_SWAGGER_EXAMPLES,
): Record<string, unknown> {
  const entry = NOTIFICATION_METADATA_SWAGGER_EXAMPLES[type];
  return (entry as { value: Record<string, unknown> }).value;
}

/** Corps complets pour `POST /notifications` (menu Examples du body). */
export const NOTIFICATION_CREATE_SWAGGER_EXAMPLES: ExamplesObject = {
  SYSTEM: {
    summary: "SYSTEM",
    value: {
      type: NotificationType.SYSTEM,
      message: "Votre export est prêt.",
      metadata: metadataExample("SYSTEM"),
    },
  },
  ADMIN_BROADCAST: {
    summary: "ADMIN_BROADCAST",
    value: {
      type: NotificationType.ADMIN_BROADCAST,
      message: "Message important : mise à jour de l'application.",
      metadata: metadataExample("ADMIN_BROADCAST"),
    },
  },
};

/** Exemples partiels pour `PATCH /notifications/:id`. */
export const NOTIFICATION_UPDATE_SWAGGER_EXAMPLES: ExamplesObject = {
  SYSTEM: {
    summary: "Mettre à jour message + metadata",
    value: {
      message: "Votre export est prêt.",
      metadata: metadataExample("SYSTEM"),
    },
  },
  markRead: {
    summary: "Marquer comme lue uniquement",
    value: { isRead: true },
  },
};

/** Objet notification complet (champ `data` des réponses). */
export const NOTIFICATION_ITEM_SWAGGER_EXAMPLES: ExamplesObject = {
  SYSTEM: {
    summary: "SYSTEM (réponse détail / liste)",
    value: {
      id: IDS.notification,
      userId: IDS.user,
      type: NotificationType.SYSTEM,
      message: "Votre export est prêt.",
      metadata: metadataExample("SYSTEM"),
      isRead: false,
      readAt: null,
      createdAt: "2026-05-22T10:15:00.000Z",
    },
  },
  ADMIN_BROADCAST: {
    summary: "ADMIN_BROADCAST",
    value: {
      id: IDS.notification,
      userId: IDS.user,
      type: NotificationType.ADMIN_BROADCAST,
      message: "Message important : mise à jour de l'application.",
      metadata: metadataExample("ADMIN_BROADCAST"),
      isRead: true,
      readAt: "2026-05-22T09:00:00.000Z",
      createdAt: "2026-05-22T08:45:00.000Z",
    },
  },
};

/** Exemples de réponse pour `GET /notifications` : un item par `NotificationType`. */
export const NOTIFICATIONS_LIST_RESPONSE_SWAGGER_EXAMPLES: ExamplesObject =
  Object.entries(NOTIFICATION_METADATA_SWAGGER_EXAMPLES).reduce<ExamplesObject>(
    (acc, [type, example]) => {
      const metadata =
        (example as { value?: Record<string, unknown> }).value ?? null;

      acc[type] = {
        summary: `${type} — exemple sur GET /notifications`,
        value: {
          success: true,
          message: "Notifications récupérées avec succès",
          data: [
            {
              id: IDS.notification,
              userId: IDS.user,
              type,
              message: `Notification de type ${type}`,
              metadata,
              isRead: false,
              readAt: null,
              createdAt: "2026-05-22T10:15:00.000Z",
            },
          ],
          count: 12,
          pagination: {
            current_page: 1,
            total_pages: 3,
            per_page: 10,
            total_items: 25,
          },
        },
      };

      return acc;
    },
    {},
  );

export const NOTIFICATION_METADATA_SWAGGER_DESCRIPTION =
  "Structure JSON variable selon `type`. Champ commun : `title` (titre affiché push / en-tête). Ouvrir le menu **Examples** sur ce champ : un exemple par `NotificationType`.";
