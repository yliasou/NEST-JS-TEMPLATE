import { applyDecorators } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { ErrorResponseSchemaDto } from "../../common/dto/response-schemas.dto";
import {
  AnnonceLatestUnreadResponseSchemaDto,
  AnnonceResponseSchemaDto,
  AnnoncesPaginatedResponseSchemaDto,
} from "../dto/annonce-response.dto";
import { CreateAnnonceDto } from "../dto/create-annonce.dto";
import { UpdateAnnonceDto } from "../dto/update-annonce.dto";

const CREATE_ANNONCE_EXAMPLE = {
  title: "Nouvelle fonctionnalité disponible",
  description:
    "Découvrez la nouvelle version de l'application et ses améliorations.",
  imageUrls: [
    "https://cdn.example.com/annonces/banner-1.jpg",
    "https://cdn.example.com/annonces/banner-2.jpg",
  ],
  isActive: true,
};

const UPDATE_ANNONCE_EXAMPLE = {
  title: "Fonctionnalité mise à jour",
  isActive: true,
};

interface QueryConfig {
  name: string;
  description: string;
  required?: boolean;
  type?: "string" | "number" | "boolean";
  example?: string | number | boolean;
  enum?: string[];
}

function buildDecorator(config: {
  summary: string;
  description?: string;
  bearerAuth?: boolean;
  queries?: QueryConfig[];
  responses: Array<{
    status: number;
    description: string;
    schema?: new (...args: unknown[]) => unknown;
  }>;
}) {
  const schemaModels = config.responses
    .filter((r) => r.schema)
    .map((r) => r.schema as new (...args: unknown[]) => unknown);

  return applyDecorators(
    ApiOperation({ summary: config.summary, description: config.description }),
    ...(config.bearerAuth ? [ApiBearerAuth()] : []),
    ...(schemaModels.length > 0 ? [ApiExtraModels(...schemaModels)] : []),
    ...(config.queries ?? []).map((q) =>
      ApiQuery({
        name: q.name,
        required: q.required ?? false,
        description: q.description,
        ...(q.type && { type: q.type }),
        ...(q.example !== undefined && { example: q.example }),
        ...(q.enum && { enum: q.enum }),
      }),
    ),
    ...config.responses.map((r) =>
      ApiResponse({
        status: r.status,
        description: r.description,
        ...(r.schema && {
          schema: { $ref: getSchemaPath(r.schema as never) },
        }),
      }),
    ),
  );
}

export function ApiMarkAnnonceRead() {
  return buildDecorator({
    summary: "Marquer une annonce comme lue",
    responses: [
      {
        status: 200,
        description: "Annonce marquée comme lue",
        schema: AnnonceResponseSchemaDto,
      },
      {
        status: 401,
        description: "Non authentifié",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 404,
        description: "Annonce introuvable",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiGetLatestUnreadAnnonce() {
  return buildDecorator({
    summary: "Dernière annonce non lue",
    bearerAuth: true,
    description:
      "Authentification **requise**. " +
      "Retourne la dernière annonce active non encore lue par l'utilisateur. `data` est `null` s’il n’y en a aucune.",
    responses: [
      {
        status: 200,
        description: "Dernière annonce non lue (ou aucune)",
        schema: AnnonceLatestUnreadResponseSchemaDto,
      },
      {
        status: 401,
        description: "Non authentifié",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 422,
        description: "Compte sans pays rattaché",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiListAnnonces() {
  return buildDecorator({
    summary: "Lister les annonces (paginé)",
    description:
      "Route publique — aucun token requis. Hors admin, seules les annonces actives sont renvoyées (le filtre `isActive=false` est ignoré). L'admin authentifié peut filtrer actives et inactives.",
    queries: [
      {
        name: "page",
        type: "number",
        example: 1,
        description: "Numéro de page (>= 1).",
      },
      {
        name: "per_page",
        type: "number",
        example: 10,
        description: "Taille de page (1-50).",
      },
      {
        name: "search",
        type: "string",
        example: "express",
        description: "Recherche sur titre ou description.",
      },
      {
        name: "isActive",
        description: "Filtre actif (true/false).",
        enum: ["true", "false"],
        example: "true",
      },
    ],
    responses: [
      {
        status: 206,
        description: "Page d’annonces récupérée",
        schema: AnnoncesPaginatedResponseSchemaDto,
      },
      {
        status: 422,
        description: "Paramètres invalides",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiGetAnnonce() {
  return buildDecorator({
    summary: "Détail d'une annonce",
    description:
      "Route publique — aucun token requis. Hors admin, une annonce inactive répond 404.",
    responses: [
      {
        status: 200,
        description: "Annonce récupérée",
        schema: AnnonceResponseSchemaDto,
      },
      {
        status: 404,
        description: "Annonce introuvable",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiCreateAnnonce() {
  return applyDecorators(
    ApiExtraModels(
      CreateAnnonceDto,
      AnnonceResponseSchemaDto,
      ErrorResponseSchemaDto,
    ),
    ApiBody({
      type: CreateAnnonceDto,
      required: true,
      description: "Body prérempli via l’exemple Swagger.",
      examples: {
        default: {
          summary: "Création d'une annonce",
          value: CREATE_ANNONCE_EXAMPLE,
        },
      },
    }),
    buildDecorator({
      summary: "Créer une annonce",
      description: "Crée une annonce, active par défaut.",
      responses: [
        {
          status: 201,
          description: "Annonce créée",
          schema: AnnonceResponseSchemaDto,
        },
        {
          status: 401,
          description: "Non authentifié",
          schema: ErrorResponseSchemaDto,
        },
        {
          status: 422,
          description: "Données invalides",
          schema: ErrorResponseSchemaDto,
        },
      ],
    }),
  );
}

export function ApiUpdateAnnonce() {
  return applyDecorators(
    ApiExtraModels(
      UpdateAnnonceDto,
      AnnonceResponseSchemaDto,
      ErrorResponseSchemaDto,
    ),
    ApiBody({
      type: UpdateAnnonceDto,
      required: true,
      description: "Mise à jour partielle.",
      examples: {
        default: {
          summary: "Mise à jour du titre",
          value: UPDATE_ANNONCE_EXAMPLE,
        },
      },
    }),
    buildDecorator({
      summary: "Modifier une annonce",
      description: "Seuls les champs envoyés sont modifiés.",
      responses: [
        {
          status: 200,
          description: "Annonce mise à jour",
          schema: AnnonceResponseSchemaDto,
        },
        {
          status: 401,
          description: "Non authentifié",
          schema: ErrorResponseSchemaDto,
        },
        {
          status: 404,
          description: "Annonce introuvable",
          schema: ErrorResponseSchemaDto,
        },
        {
          status: 422,
          description: "Données invalides",
          schema: ErrorResponseSchemaDto,
        },
      ],
    }),
  );
}
