import { applyDecorators } from "@nestjs/common";
import {
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { ErrorResponseSchemaDto } from "../../common/dto/response-schemas.dto";
import {
  NewsletterSubscriberResponseSchemaDto,
  NewsletterSubscribersPaginatedResponseSchemaDto,
} from "../dto/newsletter-subscriber-response.dto";

interface QueryConfig {
  name: string;
  description: string;
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
    .filter((r) => r.schema)
    .map((r) => r.schema as new (...args: unknown[]) => unknown);

  return applyDecorators(
    ApiOperation({ summary: config.summary, description: config.description }),
    ...(schemaModels.length > 0 ? [ApiExtraModels(...schemaModels)] : []),
    ...(config.queries ?? []).map((q) =>
      ApiQuery({
        name: q.name,
        required: false,
        description: q.description,
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

export function ApiSubscribeNewsletter() {
  return buildDecorator({
    summary: "S’inscrire à la newsletter",
    description:
      "Enregistre une adresse e-mail pour les envois futurs. Idempotent : réinscription réactive un compte désinscrit.",
    responses: [
      {
        status: 201,
        description: "Inscription enregistrée",
        schema: NewsletterSubscriberResponseSchemaDto,
      },
      {
        status: 422,
        description: "E-mail invalide",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiListNewsletterSubscribers() {
  return buildDecorator({
    summary: "Lister les inscrits newsletter (paginé)",
    queries: [
      { name: "page", description: "Numéro de page (>= 1)." },
      { name: "per_page", description: "Taille de page (1-50)." },
      { name: "search", description: "Recherche sur l’e-mail." },
      { name: "isActive", description: "Filtre actif (true/false)." },
    ],
    responses: [
      {
        status: 206,
        description: "Page d’inscrits récupérée",
        schema: NewsletterSubscribersPaginatedResponseSchemaDto,
      },
      {
        status: 401,
        description: "Non authentifié",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 422,
        description: "Paramètres invalides",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiUpdateNewsletterSubscriber() {
  return buildDecorator({
    summary: "Modifier un inscrit (ex. désinscription)",
    responses: [
      {
        status: 200,
        description: "Inscrit mis à jour",
        schema: NewsletterSubscriberResponseSchemaDto,
      },
      {
        status: 401,
        description: "Non authentifié",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 404,
        description: "Inscrit introuvable",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 422,
        description: "Données invalides",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}
