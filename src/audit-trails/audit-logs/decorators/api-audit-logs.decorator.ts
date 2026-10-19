import { applyDecorators } from "@nestjs/common";
import {
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { AuditAction, AuditEntity } from "@prisma/client";
import { ErrorResponseSchemaDto } from "../../../common/dto/response-schemas.dto";
import { AuditLogsPaginatedResponseSchemaDto } from "../dto/audit-log-response.dto";
import { AUDIT_LOGS_LIST_RESPONSE_SWAGGER_EXAMPLES } from "../dto/audit-logs.swagger-examples";

export function ApiListAuditLogs() {
  return applyDecorators(
    ApiOperation({
      summary: "Lister les logs d'audit (paginé)",
      description:
        "Journal des actions tracées dans le système (authentification, opérations admin, etc.). " +
        "Filtres optionnels : `action`, `entity`, `search` (prénom, nom ou email de l'auteur/cible), `actorUserId`, `targetUserId`. " +
        "Chaque log expose `actor`, `target`, `ip` et la géolocalisation GPS si le client envoie les headers `x-client-latitude`, `x-client-longitude`, `x-client-location-accuracy`, `x-client-location-captured-at`. " +
        "Format `PaginatedResponse`. Statut **206 Partial Content** (spec API mobile). " +
        "Ouvrir le menu **Examples** de la réponse 206 pour voir des cas par type d'action.",
    }),
    ApiExtraModels(AuditLogsPaginatedResponseSchemaDto, ErrorResponseSchemaDto),
    ApiQuery({
      name: "page",
      required: false,
      description: "Numéro de page (>= 1).",
    }),
    ApiQuery({
      name: "per_page",
      required: false,
      description: "Taille de page (1-50).",
    }),
    ApiQuery({
      name: "action",
      required: false,
      description: "Filtrer par action d'audit.",
      enum: AuditAction,
    }),
    ApiQuery({
      name: "entity",
      required: false,
      description: "Filtrer par entité concernée.",
      enum: AuditEntity,
    }),
    ApiQuery({
      name: "actorUserId",
      required: false,
      description:
        "Filtrer par identifiant de l'utilisateur auteur de l'action.",
    }),
    ApiQuery({
      name: "targetUserId",
      required: false,
      description: "Filtrer par identifiant de l'utilisateur cible.",
    }),
    ApiQuery({
      name: "search",
      required: false,
      description:
        "Recherche sur l'auteur ou la cible (prénom, nom ou email, insensible à la casse).",
      example: "Koné",
    }),
    ApiResponse({
      status: 206,
      description: "Page de logs d'audit récupérée.",
      content: {
        "application/json": {
          schema: {
            $ref: getSchemaPath(AuditLogsPaginatedResponseSchemaDto),
          },
          examples: AUDIT_LOGS_LIST_RESPONSE_SWAGGER_EXAMPLES,
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Non authentifié",
      schema: { $ref: getSchemaPath(ErrorResponseSchemaDto) },
    }),
    ApiResponse({
      status: 403,
      description: "Accès refusé (admin requis)",
      schema: { $ref: getSchemaPath(ErrorResponseSchemaDto) },
    }),
    ApiResponse({
      status: 422,
      description: "Paramètres invalides",
      schema: { $ref: getSchemaPath(ErrorResponseSchemaDto) },
    }),
  );
}
