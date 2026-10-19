import { applyDecorators } from "@nestjs/common";
import {
  ApiExtraModels,
  ApiParam,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { ErrorResponseSchemaDto } from "../../../common/dto/response-schemas.dto";
import {
  AdminSentNotificationDetailResponseSchemaDto,
  AdminSentNotificationsPaginatedResponseSchemaDto,
} from "../dto/admin-sent-notifications-response.dto";

function withCommonResponses() {
  return [
    ApiResponse({
      status: 200,
      description: "Notification envoyee",
    }),
    ApiResponse({
      status: 401,
      description: "Non authentifie",
      schema: { $ref: getSchemaPath(ErrorResponseSchemaDto) },
    }),
    ApiResponse({
      status: 403,
      description: "Acces refuse (admin requis)",
      schema: { $ref: getSchemaPath(ErrorResponseSchemaDto) },
    }),
    ApiResponse({
      status: 422,
      description: "Corps invalide",
      schema: { $ref: getSchemaPath(ErrorResponseSchemaDto) },
    }),
  ];
}

export function ApiAdminSendNotificationToUser() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseSchemaDto),
    ApiOperation({
      summary: "Envoyer une notification a un utilisateur",
      description:
        "Le destinataire est fourni via le parametre de route `userId`.",
    }),
    ApiParam({
      name: "userId",
      description: "Identifiant de l'utilisateur destinataire",
      example: "clxxxxxxxxxxxxxxxxxxxxxxxx",
    }),
    ...withCommonResponses(),
    ApiResponse({
      status: 404,
      description: "Utilisateur introuvable",
      schema: { $ref: getSchemaPath(ErrorResponseSchemaDto) },
    }),
  );
}

export function ApiAdminSendNotificationToRole() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseSchemaDto),
    ApiOperation({
      summary: "Envoyer une notification a un role",
      description:
        "Le role cible est fourni via le parametre de route `role`. Seuls les utilisateurs actifs de ce rôle sont notifiés.",
    }),
    ApiParam({
      name: "role",
      enum: Role,
      description: "Role cible",
    }),
    ...withCommonResponses(),
  );
}

export function ApiAdminListSentNotifications() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseSchemaDto),
    ApiOperation({
      summary: "Lister les notifications push admin envoyées",
      description:
        "Historique des campagnes push envoyées depuis le backoffice (utilisateur ou rôle).\n\n" +
        "Source : journaux d’audit `ADMIN_NOTIFICATION_SEND` enrichis avec titre, message et statistiques de lecture.",
    }),
    ApiResponse({
      status: 206,
      description: "Liste paginée récupérée.",
      schema: {
        $ref: getSchemaPath(AdminSentNotificationsPaginatedResponseSchemaDto),
      },
    }),
    ...withCommonResponses(),
  );
}

export function ApiAdminGetSentNotification() {
  return applyDecorators(
    ApiExtraModels(ErrorResponseSchemaDto),
    ApiOperation({
      summary: "Détail d'une notification push admin envoyée",
      description:
        "`campaignId` = `broadcastId`, `notificationId` (envoi unitaire) ou `auditLogId`.",
    }),
    ApiParam({
      name: "campaignId",
      description: "Identifiant de campagne",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
    ApiResponse({
      status: 200,
      description: "Détail récupéré.",
      schema: {
        $ref: getSchemaPath(AdminSentNotificationDetailResponseSchemaDto),
      },
    }),
    ...withCommonResponses(),
    ApiResponse({
      status: 404,
      description: "Campagne introuvable (`adminSentNotificationNotFound`).",
      schema: { $ref: getSchemaPath(ErrorResponseSchemaDto) },
    }),
  );
}
