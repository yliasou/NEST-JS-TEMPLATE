import { applyDecorators } from "@nestjs/common";
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { ErrorResponseSchemaDto } from "../../../common/dto/response-schemas.dto";
import {
  PermissionsCatalogResponseSchemaDto,
  UserAccessResponseSchemaDto,
} from "../dto/access-response.dto";
import { ApplyAccessTemplateDto } from "../dto/apply-access-template.dto";
import { UpdateUserAccessDto } from "../dto/update-user-access.dto";

const ACCESS_SECURITY =
  "Accès réservé aux comptes `Role.ADMIN`. " +
  "Les permissions granulaires sont lues depuis `AdminProfile.metadata.access`. " +
  "Sans metadata.access : aucun droit. " +
  "Super admin explicite (`isSuperAdmin`) : toutes les permissions.";

function buildDecorator(config: {
  summary: string;
  description?: string;
  params?: Array<{ name: string; description: string; example?: string }>;
  body?: {
    type: new (...args: unknown[]) => unknown;
    description?: string;
    examples?: Record<string, { summary: string; value: unknown }>;
  };
  responses: Array<{
    status: number;
    description: string;
    schema?: new (...args: unknown[]) => unknown;
  }>;
}) {
  const schemaModels = [
    ...config.responses
      .filter((r) => r.schema)
      .map((r) => r.schema as new (...args: unknown[]) => unknown),
    ...(config.body ? [config.body.type] : []),
  ];

  return applyDecorators(
    ApiOperation({
      summary: config.summary,
      description: [ACCESS_SECURITY, config.description]
        .filter(Boolean)
        .join("\n\n"),
    }),
    ...(schemaModels.length > 0 ? [ApiExtraModels(...schemaModels)] : []),
    ...(config.params ?? []).map((p) =>
      ApiParam({
        name: p.name,
        description: p.description,
        ...(p.example ? { example: p.example } : {}),
      }),
    ),
    ...(config.body
      ? [
          ApiBody({
            type: config.body.type,
            description: config.body.description,
            ...(config.body.examples ? { examples: config.body.examples } : {}),
          }),
        ]
      : []),
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

const forbidden = {
  status: 403,
  description:
    "Permission manquante, modification de ses propres droits, ou règle de sécurité refusée.",
  schema: ErrorResponseSchemaDto,
};

const unauthorized = {
  status: 401,
  description: "Token manquant ou invalide.",
  schema: ErrorResponseSchemaDto,
};

const notFound = {
  status: 404,
  description: "Utilisateur cible introuvable.",
  schema: ErrorResponseSchemaDto,
};

const validation = {
  status: 422,
  description:
    "Payload invalide (permission inconnue, metadata invalide, etc.).",
  schema: ErrorResponseSchemaDto,
};

export function ApiListAccessPermissions() {
  return buildDecorator({
    summary: "Catalogue des permissions disponibles",
    description:
      "Retourne les permissions regroupées par module / sous-module, " +
      "les modèles (templates) applicables, et la liste plate des clés. " +
      "Permission requise : `admin.access.view`.",
    responses: [
      {
        status: 200,
        description: "Catalogue récupéré",
        schema: PermissionsCatalogResponseSchemaDto,
      },
      unauthorized,
      forbidden,
    ],
  });
}

export function ApiGetMyAccess() {
  return buildDecorator({
    summary: "Droits de l’utilisateur connecté",
    description:
      "Retourne le rôle, `isSuperAdmin`, `legacyFullAccess`, les permissions effectives. " +
      "Utilisé par le front pour afficher / masquer menus et actions. " +
      "Aucune permission granulaire supplémentaire : tout admin authentifié.",
    responses: [
      {
        status: 200,
        description: "Permissions effectives",
        schema: UserAccessResponseSchemaDto,
      },
      unauthorized,
      forbidden,
    ],
  });
}

export function ApiGetUserAccess() {
  return buildDecorator({
    summary: "Consulter les droits d’un utilisateur",
    description:
      "Retourne les permissions effectives de l’utilisateur cible. " +
      "Crée une trace d’audit `ADMIN_ACCESS_VIEW`. " +
      "Permission requise : `admin.access.view`.",
    params: [
      {
        name: "userId",
        description: "ID de l’utilisateur admin cible.",
        example: "clxuser002",
      },
    ],
    responses: [
      {
        status: 200,
        description: "Permissions cible",
        schema: UserAccessResponseSchemaDto,
      },
      unauthorized,
      forbidden,
      notFound,
    ],
  });
}

export function ApiUpdateUserAccess() {
  return buildDecorator({
    summary: "Modifier les droits d’un utilisateur",
    description:
      "Met à jour `isSuperAdmin` et/ou `permissions` dans `AdminProfile.metadata.access`. " +
      "Règles : pas d’auto-modification ; on ne peut pas donner une permission qu’on ne possède pas " +
      "(sauf super admin) ; on ne peut pas retirer le dernier super admin. " +
      "Audit : `ADMIN_ACCESS_UPDATE` (+ permission / super-admin si applicable). " +
      "Permission requise : `admin.access.update`.",
    params: [
      {
        name: "userId",
        description: "ID de l’utilisateur admin cible (≠ acteur).",
        example: "clxuser002",
      },
    ],
    body: {
      type: UpdateUserAccessDto,
      description: "Patch partiel des droits.",
      examples: {
        grantUsersView: {
          summary: "Accorder la consultation des utilisateurs",
          value: {
            permissions: {
              "admin.users.view": true,
              "admin.users.delete": false,
            },
          },
        },
        makeSuperAdmin: {
          summary: "Promouvoir super admin",
          value: { isSuperAdmin: true },
        },
      },
    },
    responses: [
      {
        status: 200,
        description: "Droits mis à jour",
        schema: UserAccessResponseSchemaDto,
      },
      unauthorized,
      forbidden,
      notFound,
      validation,
    ],
  });
}

export function ApiResetUserAccess() {
  return buildDecorator({
    summary: "Réinitialiser les droits custom",
    description:
      "Supprime `metadata.access` : l'admin n'a plus aucun droit jusqu'à réattribution. " +
      "Audit : `ADMIN_ACCESS_RESET`. " +
      "Permission requise : `admin.access.reset`.",
    params: [
      {
        name: "userId",
        description: "ID de l’utilisateur admin cible (≠ acteur).",
        example: "clxuser002",
      },
    ],
    responses: [
      {
        status: 200,
        description: "Droits réinitialisés",
        schema: UserAccessResponseSchemaDto,
      },
      unauthorized,
      forbidden,
      notFound,
    ],
  });
}

export function ApiApplyAccessTemplate() {
  return buildDecorator({
    summary: "Appliquer un modèle de permissions",
    description:
      "Applique un template (`SUPER_ADMIN`, `USER_MANAGER`, `MARKETING_MANAGER`) " +
      "comme base rapide de droits. " +
      "Audit : `ADMIN_ACCESS_TEMPLATE_APPLY`. " +
      "Permission requise : `admin.access.assign_template`.",
    params: [
      {
        name: "userId",
        description: "ID de l’utilisateur admin cible (≠ acteur).",
        example: "clxuser002",
      },
    ],
    body: {
      type: ApplyAccessTemplateDto,
      description: "Identifiant du template.",
      examples: {
        userManager: {
          summary: "Gestionnaire utilisateurs",
          value: { templateId: "USER_MANAGER" },
        },
        marketingManager: {
          summary: "Responsable marketing",
          value: { templateId: "MARKETING_MANAGER" },
        },
      },
    },
    responses: [
      {
        status: 200,
        description: "Template appliqué",
        schema: UserAccessResponseSchemaDto,
      },
      unauthorized,
      forbidden,
      notFound,
      validation,
    ],
  });
}
