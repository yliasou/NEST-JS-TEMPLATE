import type { ExamplesObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";
import { AuditAction, AuditEntity } from "@prisma/client";

const IDS = {
  admin: "cmadmin001xxxxxxxxxxxxxx",
  user: "cmuser001xxxxxxxxxxxxxxx",
  example: "clexamplexxxxxxxxxxxxxxx",
  notification: "clnotifxxxxxxxxxxxxxxxxxxx",
} as const;

const PAGINATION = {
  current_page: 1,
  total_pages: 5,
  per_page: 10,
  total_items: 42,
} as const;

const SINGLE_PAGE = {
  current_page: 1,
  total_pages: 1,
  per_page: 10,
  total_items: 1,
} as const;

const USERS = {
  admin: {
    id: IDS.admin,
    firstName: "Admin",
    lastName: "App",
    email: "admin@app.local",
  },
  user: {
    id: IDS.user,
    firstName: "Ada",
    lastName: "Lovelace",
    email: "user.demo@app.local",
  },
} as const;

const auditLogBase = {
  requestId: "req-7f3a2b1c-9d8e-4f5a-b6c7-d8e9f0a1b2c3",
  ip: "196.168.1.42",
  latitude: 48.8566,
  longitude: 2.3522,
  locationAccuracy: 12,
  locationCapturedAt: "2026-05-22T08:14:57.000Z",
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
};

/** Exemples de réponse pour `GET /admin/audit-trails/audit-logs`. */
export const AUDIT_LOGS_LIST_RESPONSE_SWAGGER_EXAMPLES: ExamplesObject = {
  mixed: {
    summary: "Page mixte — plusieurs types d'actions",
    description:
      "Liste paginée par défaut, triée par `createdAt` décroissant. Ouvrir les autres exemples pour voir des cas par `action`.",
    value: {
      success: true,
      message: "Logs d'audit récupérés avec succès",
      data: [
        {
          id: "cmaudit001xxxxxxxxxxxxxx",
          actorUserId: IDS.user,
          targetUserId: null,
          actor: USERS.user,
          target: null,
          ...auditLogBase,
          action: AuditAction.AUTH_LOGIN,
          entity: AuditEntity.USER,
          entityId: IDS.user,
          metadata: { method: "email", role: "USER" },
          createdAt: "2026-05-22T08:15:00.000Z",
        },
        {
          id: "cmaudit002xxxxxxxxxxxxxx",
          actorUserId: IDS.admin,
          targetUserId: null,
          actor: USERS.admin,
          target: null,
          ...auditLogBase,
          action: AuditAction.EXAMPLE_CREATE,
          entity: AuditEntity.EXAMPLE,
          entityId: IDS.example,
          metadata: { name: "Premier exemple" },
          createdAt: "2026-05-22T08:20:00.000Z",
        },
        {
          id: "cmaudit003xxxxxxxxxxxxxx",
          actorUserId: IDS.admin,
          targetUserId: IDS.user,
          actor: USERS.admin,
          target: USERS.user,
          ...auditLogBase,
          action: AuditAction.ADMIN_NOTIFICATION_SEND,
          entity: AuditEntity.USER,
          entityId: IDS.user,
          metadata: {
            notificationId: IDS.notification,
            title: "Information",
            channel: "push",
          },
          createdAt: "2026-05-22T09:00:00.000Z",
        },
      ],
      pagination: PAGINATION,
    },
  },
  AUTH_LOGIN: {
    summary: "AUTH_LOGIN — connexion utilisateur",
    value: {
      success: true,
      message: "Logs d'audit récupérés avec succès",
      data: [
        {
          id: "cmaudit001xxxxxxxxxxxxxx",
          actorUserId: IDS.user,
          targetUserId: null,
          actor: USERS.user,
          target: null,
          requestId: "req-auth-login-001",
          action: AuditAction.AUTH_LOGIN,
          entity: AuditEntity.USER,
          entityId: IDS.user,
          metadata: { method: "email", role: "USER" },
          ip: "196.168.1.42",
          userAgent: "App/1.0.0 (Android 14)",
          createdAt: "2026-05-22T08:15:00.000Z",
        },
      ],
      pagination: SINGLE_PAGE,
    },
  },
  ADMIN_USER_SUSPEND: {
    summary: "ADMIN_USER_SUSPEND — suspension de compte",
    value: {
      success: true,
      message: "Logs d'audit récupérés avec succès",
      data: [
        {
          id: "cmaudit005xxxxxxxxxxxxxx",
          actorUserId: IDS.admin,
          targetUserId: IDS.user,
          actor: USERS.admin,
          target: USERS.user,
          requestId: "req-user-suspend-001",
          action: AuditAction.ADMIN_USER_SUSPEND,
          entity: AuditEntity.USER,
          entityId: IDS.user,
          metadata: {
            reason: "TERMS_VIOLATION",
            previousIsActive: true,
          },
          ip: "10.0.0.12",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          createdAt: "2026-05-22T11:00:00.000Z",
        },
      ],
      pagination: SINGLE_PAGE,
    },
  },
  empty: {
    summary: "Liste vide — aucun log pour les filtres appliqués",
    description:
      "Retourné quand `action`, `entity`, `search`, `actorUserId` ou `targetUserId` ne correspondent à aucun enregistrement.",
    value: {
      success: true,
      message: "Logs d'audit récupérés avec succès",
      data: [],
      pagination: {
        current_page: 1,
        total_pages: 1,
        per_page: 10,
        total_items: 0,
      },
    },
  },
};
