import { applyDecorators } from "@nestjs/common";
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { NotificationType } from "@prisma/client";
import { ErrorResponseSchemaDto } from "../../../common/dto/response-schemas.dto";
import { CreateNotificationDto } from "../dto/create-notification.dto";
import {
  NOTIFICATION_CREATE_SWAGGER_EXAMPLES,
  NOTIFICATION_METADATA_SWAGGER_DESCRIPTION,
  NOTIFICATIONS_LIST_RESPONSE_SWAGGER_EXAMPLES,
  NOTIFICATION_UPDATE_SWAGGER_EXAMPLES,
} from "../dto/notification-metadata.swagger-examples";
import {
  MarkAllNotificationsReadSchemaDto,
  NotificationResponseSchemaDto,
  NotificationsPaginatedResponseSchemaDto,
} from "../dto/notification-response.dto";
import { UpdateNotificationDto } from "../dto/update-notification.dto";

interface QueryConfig {
  name: string;
  description: string;
  required?: boolean;
  enum?: string[];
}

function buildDecorator(config: {
  summary: string;
  description?: string;
  queries?: QueryConfig[];
  responses: Array<{
    status: number;
    description: string;
    schema?: new (...args: unknown[]) => unknown;
  }>;
}) {
  const schemaModels = config.responses
    .filter((response) => response.schema)
    .map((response) => response.schema as new (...args: unknown[]) => unknown);

  return applyDecorators(
    ApiOperation({ summary: config.summary, description: config.description }),
    ...(schemaModels.length > 0 ? [ApiExtraModels(...schemaModels)] : []),
    ...(config.queries ?? []).map((query) =>
      ApiQuery({
        name: query.name,
        required: query.required ?? false,
        description: query.description,
        ...(query.enum && { enum: query.enum }),
      }),
    ),
    ...config.responses.map((response) =>
      ApiResponse({
        status: response.status,
        description: response.description,
        ...(response.schema && {
          schema: { $ref: getSchemaPath(response.schema as never) },
        }),
      }),
    ),
  );
}

export function ApiListNotifications() {
  return applyDecorators(
    ApiOperation({
      summary: "Lister mes notifications (pagine)",
      description:
        "Retourne la liste paginee des notifications de l utilisateur authentifie, avec filtres optionnels. Le champ `count` indique le nombre de notifications non lues (badge). " +
        "Chaque element `data[]` expose un champ `metadata` dont la forme depend du `type` (toujours avec `title`) : sur cette route, ouvrir le menu **Examples** de la reponse 206 pour voir un exemple par `NotificationType`.",
    }),
    ApiExtraModels(NotificationsPaginatedResponseSchemaDto),
    ApiQuery({
      name: "page",
      required: false,
      description: "Numero de page (>= 1).",
    }),
    ApiQuery({
      name: "per_page",
      required: false,
      description: "Taille de page (1-50).",
    }),
    ApiQuery({
      name: "isRead",
      required: false,
      description: "true | false",
      enum: ["true", "false"],
    }),
    ApiQuery({
      name: "type",
      required: false,
      description: "Filtre par type de notification.",
      enum: Object.values(NotificationType),
    }),
    ApiResponse({
      status: 206,
      description: "Page de notifications recuperee",
      content: {
        "application/json": {
          schema: {
            $ref: getSchemaPath(NotificationsPaginatedResponseSchemaDto),
          },
          examples: NOTIFICATIONS_LIST_RESPONSE_SWAGGER_EXAMPLES,
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Non authentifie",
      schema: { $ref: getSchemaPath(ErrorResponseSchemaDto) },
    }),
    ApiResponse({
      status: 422,
      description: "Parametres invalides",
      schema: { $ref: getSchemaPath(ErrorResponseSchemaDto) },
    }),
  );
}

export function ApiGetNotification() {
  return buildDecorator({
    summary: "Detail d'une notification",
    description:
      "Retourne une notification appartenant a l'utilisateur authentifie. " +
      NOTIFICATION_METADATA_SWAGGER_DESCRIPTION,
    responses: [
      {
        status: 200,
        description: "Notification recuperee",
        schema: NotificationResponseSchemaDto,
      },
      {
        status: 401,
        description: "Non authentifie",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 404,
        description: "Notification introuvable",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiCreateNotification() {
  return applyDecorators(
    ApiBody({
      type: CreateNotificationDto,
      examples: NOTIFICATION_CREATE_SWAGGER_EXAMPLES,
      description:
        "Menu **Examples** : un corps par cas courant (`type` + `message` + `metadata` alignes). Pour tous les types, voir aussi les exemples du champ `metadata` seul.",
    }),
    buildDecorator({
      summary: "Creer une notification",
      description:
        "Cree une notification pour l'utilisateur authentifie avec type, message et metadata optionnelle. " +
        NOTIFICATION_METADATA_SWAGGER_DESCRIPTION,
      responses: [
        {
          status: 201,
          description: "Notification creee",
          schema: NotificationResponseSchemaDto,
        },
        {
          status: 401,
          description: "Non authentifie",
          schema: ErrorResponseSchemaDto,
        },
        {
          status: 422,
          description: "Donnees invalides",
          schema: ErrorResponseSchemaDto,
        },
      ],
    }),
  );
}

export function ApiUpdateNotification() {
  return applyDecorators(
    ApiBody({
      type: UpdateNotificationDto,
      examples: NOTIFICATION_UPDATE_SWAGGER_EXAMPLES,
      description:
        "Mises a jour partielles. Les exemples `metadata` suivent les memes formes que a la creation (menu **Examples** sur `metadata` dans le schema).",
    }),
    buildDecorator({
      summary: "Modifier une notification",
      description:
        "Met a jour les champs envoyes d'une notification de l'utilisateur authentifie. " +
        NOTIFICATION_METADATA_SWAGGER_DESCRIPTION,
      responses: [
        {
          status: 200,
          description: "Notification mise a jour",
          schema: NotificationResponseSchemaDto,
        },
        {
          status: 401,
          description: "Non authentifie",
          schema: ErrorResponseSchemaDto,
        },
        {
          status: 404,
          description: "Notification introuvable",
          schema: ErrorResponseSchemaDto,
        },
        {
          status: 422,
          description: "Aucune donnee exploitable",
          schema: ErrorResponseSchemaDto,
        },
      ],
    }),
  );
}

export function ApiMarkNotificationRead() {
  return buildDecorator({
    summary: "Marquer une notification comme lue",
    description:
      "Positionne isRead=true et readAt=now pour une notification de l'utilisateur authentifie.",
    responses: [
      {
        status: 200,
        description: "Notification marquee comme lue",
        schema: NotificationResponseSchemaDto,
      },
      {
        status: 401,
        description: "Non authentifie",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 404,
        description: "Notification introuvable",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiMarkAllNotificationsRead() {
  return buildDecorator({
    summary: "Marquer toutes mes notifications comme lues",
    description:
      "Marque toutes les notifications non lues de l'utilisateur authentifie.",
    responses: [
      {
        status: 200,
        description: "Notifications marquees comme lues",
        schema: MarkAllNotificationsReadSchemaDto,
      },
      {
        status: 401,
        description: "Non authentifie",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}
