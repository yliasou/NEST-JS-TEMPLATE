import { applyDecorators } from "@nestjs/common";
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import {
  ErrorResponseSchemaDto,
  SuccessResponseSchemaDto,
} from "../../common/dto/response-schemas.dto";
import { CreateExampleDto } from "../dto/create-example.dto";
import {
  ExampleResponseSchemaDto,
  ExamplesPaginatedResponseSchemaDto,
} from "../dto/example-response.dto";
import { UpdateExampleDto } from "../dto/update-example.dto";

type SchemaClass = new (...args: unknown[]) => unknown;

interface QueryConfig {
  name: string;
  description: string;
}

function buildDecorator(config: {
  summary: string;
  description?: string;
  idParam?: boolean;
  queries?: QueryConfig[];
  responses: Array<{
    status: number;
    description: string;
    schema?: SchemaClass;
  }>;
}) {
  const schemaModels = config.responses
    .filter((r) => r.schema)
    .map((r) => r.schema as SchemaClass);

  return applyDecorators(
    ApiOperation({ summary: config.summary, description: config.description }),
    ...(schemaModels.length > 0 ? [ApiExtraModels(...schemaModels)] : []),
    ...(config.idParam
      ? [
          ApiParam({
            name: "id",
            description: "Identifiant de l'exemple.",
            example: "clexamplexxxxxxxxxxxxxxx",
          }),
        ]
      : []),
    ...(config.queries ?? []).map((q) =>
      ApiQuery({ name: q.name, required: false, description: q.description }),
    ),
    ...config.responses.map((r) =>
      ApiResponse({
        status: r.status,
        description: r.description,
        ...(r.schema && { schema: { $ref: getSchemaPath(r.schema as never) } }),
      }),
    ),
  );
}

const unauthorized = {
  status: 401,
  description: "Non authentifié",
  schema: ErrorResponseSchemaDto,
};
const forbidden = {
  status: 403,
  description: "Permission manquante",
  schema: ErrorResponseSchemaDto,
};
const notFound = {
  status: 404,
  description: "Exemple introuvable",
  schema: ErrorResponseSchemaDto,
};
const validation = {
  status: 422,
  description: "Données invalides",
  schema: ErrorResponseSchemaDto,
};

export function ApiListExamples() {
  return buildDecorator({
    summary: "Lister les exemples (paginé)",
    description: "Permission requise : `examples.examples.view`.",
    queries: [
      { name: "page", description: "Numéro de page (>= 1)." },
      { name: "per_page", description: "Taille de page (1-50)." },
      {
        name: "search",
        description: "Recherche sur le nom ou la description.",
      },
      { name: "isActive", description: "Filtre actif (true/false)." },
    ],
    responses: [
      {
        status: 206,
        description: "Page d'exemples récupérée",
        schema: ExamplesPaginatedResponseSchemaDto,
      },
      unauthorized,
      forbidden,
      validation,
    ],
  });
}

export function ApiGetExample() {
  return buildDecorator({
    summary: "Détail d'un exemple",
    description: "Permission requise : `examples.examples.view`.",
    idParam: true,
    responses: [
      {
        status: 200,
        description: "Exemple récupéré",
        schema: ExampleResponseSchemaDto,
      },
      unauthorized,
      forbidden,
      notFound,
    ],
  });
}

export function ApiCreateExample() {
  return applyDecorators(
    ApiBody({ type: CreateExampleDto }),
    buildDecorator({
      summary: "Créer un exemple",
      description:
        "Trace `EXAMPLE_CREATE` dans l'audit et enfile un job BullMQ qui notifie le créateur (exécuté inline sans Redis). " +
        "Permission requise : `examples.examples.create`.",
      responses: [
        {
          status: 201,
          description: "Exemple créé",
          schema: ExampleResponseSchemaDto,
        },
        unauthorized,
        forbidden,
        validation,
      ],
    }),
  );
}

export function ApiUpdateExample() {
  return applyDecorators(
    ApiBody({ type: UpdateExampleDto }),
    buildDecorator({
      summary: "Modifier un exemple",
      description:
        "Mise à jour partielle, au moins un champ requis. Permission requise : `examples.examples.update`.",
      idParam: true,
      responses: [
        {
          status: 200,
          description: "Exemple mis à jour",
          schema: ExampleResponseSchemaDto,
        },
        unauthorized,
        forbidden,
        notFound,
        validation,
      ],
    }),
  );
}

export function ApiDeleteExample() {
  return buildDecorator({
    summary: "Supprimer un exemple",
    description: "Permission requise : `examples.examples.delete`.",
    idParam: true,
    responses: [
      {
        status: 200,
        description: "Exemple supprimé",
        schema: SuccessResponseSchemaDto,
      },
      unauthorized,
      forbidden,
      notFound,
    ],
  });
}
