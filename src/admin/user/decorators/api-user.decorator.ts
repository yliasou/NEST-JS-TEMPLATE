import { applyDecorators } from "@nestjs/common";
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { ErrorResponseSchemaDto } from "../../../common/dto/response-schemas.dto";
import { CreateUserDto } from "../dto/create-user.dto";
import { USER_CREATE_SWAGGER_EXAMPLES } from "../dto/create-user.swagger-examples";
import { UpdateUserDto } from "../dto/update-user.dto";
import { USER_UPDATE_SWAGGER_EXAMPLES } from "../dto/update-user.swagger-examples";
import {
  ConnectedUsersCountResponseSchemaDto,
  UserResponseSchemaDto,
  UsersPaginatedResponseSchemaDto,
} from "../dto/user-response.dto";

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
    .filter((r) => r.schema)
    .map((r) => r.schema as new (...args: unknown[]) => unknown);

  return applyDecorators(
    ApiOperation({ summary: config.summary, description: config.description }),
    ...(schemaModels.length > 0 ? [ApiExtraModels(...schemaModels)] : []),
    ...(config.queries ?? []).map((q) =>
      ApiQuery({
        name: q.name,
        required: q.required ?? false,
        description: q.description,
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

export function ApiListUsers() {
  return buildDecorator({
    summary: "Lister les utilisateurs",
    description:
      "Liste paginée des utilisateurs (tous rôles). Le profil admin (`AdminProfile`) est présent uniquement pour les comptes ADMIN. Format `PaginatedResponse`. En GET avec succès, statut **206 Partial Content** (spec API mobile).",
    queries: [
      { name: "page", description: "Numéro de page (≥ 1)." },
      { name: "per_page", description: "Taille de page (1–50)." },
      {
        name: "search",
        description:
          "Recherche libre : identifiant, e-mail, téléphone, prénom ou nom (contient).",
      },
      {
        name: "isActive",
        description: "true | false",
        enum: ["true", "false"],
      },
      {
        name: "role",
        description: "Rôle utilisateur (USER, ADMIN).",
      },
      {
        name: "level",
        description:
          "Niveau profil admin (filtre applicable aux comptes ADMIN).",
      },
    ],
    responses: [
      {
        status: 206,
        description: "Page récupérée",
        schema: UsersPaginatedResponseSchemaDto,
      },
      {
        status: 401,
        description: "Non authentifié",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 403,
        description: "Accès refusé (rôle non admin)",
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

export function ApiCountConnectedUsers() {
  return buildDecorator({
    summary: "Utilisateurs connectés",
    description:
      "Retourne le nombre et une liste légère des comptes actifs dont la dernière requête authentifiée (`lastRequestAt`) est dans la fenêtre de l'access JWT. La présence est écrite au plus une fois par minute et n'avance pas `updatedAt`.",
    queries: [
      {
        name: "role",
        description: "Filtrer par rôle (USER, ADMIN).",
      },
    ],
    responses: [
      {
        status: 200,
        description: "Compteur et liste récupérés",
        schema: ConnectedUsersCountResponseSchemaDto,
      },
      {
        status: 401,
        description: "Non authentifié",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 403,
        description: "Accès refusé (rôle non admin)",
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

export function ApiGetUser() {
  return buildDecorator({
    summary: "Détail utilisateur",
    description:
      "Retourne un utilisateur (tous rôles) avec son profil et, si disponible, son `AdminProfile`.",
    responses: [
      {
        status: 200,
        description: "Utilisateur récupéré",
        schema: UserResponseSchemaDto,
      },
      {
        status: 401,
        description: "Non authentifié",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 403,
        description: "Accès refusé (rôle non admin)",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 404,
        description: "Utilisateur introuvable",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiCreateUser() {
  return applyDecorators(
    ApiBody({
      type: CreateUserDto,
      examples: USER_CREATE_SWAGGER_EXAMPLES,
      description:
        "Exemples par `role`. `avatarUrl` est géré au niveau `User`. Dans Swagger UI, ouvrir le menu **Examples** du body pour préremplir le JSON.",
    }),
    buildDecorator({
      summary: "Créer un utilisateur",
      description:
        "Crée un compte avec mot de passe local. Mot de passe : minimum 8 caractères ; un `USER` accepte aussi un PIN de 4 chiffres (parcours téléphone). Champs selon le `role` : `ADMIN` → `adminLevel`, `department` ; `USER` → base uniquement. `avatarUrl` est stocké directement sur `User`.",
      responses: [
        {
          status: 201,
          description: "Utilisateur créé",
          schema: UserResponseSchemaDto,
        },
        {
          status: 401,
          description: "Non authentifié",
          schema: ErrorResponseSchemaDto,
        },
        {
          status: 403,
          description: "Accès refusé (rôle non admin)",
          schema: ErrorResponseSchemaDto,
        },
        {
          status: 422,
          description:
            "Données invalides, e-mail / téléphone / permis déjà utilisé",
          schema: ErrorResponseSchemaDto,
        },
      ],
    }),
  );
}

export function ApiUpdateUser() {
  return applyDecorators(
    ApiBody({
      type: UpdateUserDto,
      examples: USER_UPDATE_SWAGGER_EXAMPLES,
      description:
        "Exemples : désactivation (`isActive: false`), avatar (`avatarUrl`), niveau admin, changement d’e-mail / mot de passe — menu **Examples** dans Swagger UI.",
    }),
    buildDecorator({
      summary: "Modifier un utilisateur",
      description:
        "Mise à jour partielle : compte (`isActive`, e-mail, téléphone, `avatarUrl`, mot de passe), profil (`firstName`, `lastName`) et, pour un `ADMIN`, `adminLevel` / `department`. Au moins un champ requis.",
      responses: [
        {
          status: 200,
          description: "Utilisateur mis à jour",
          schema: UserResponseSchemaDto,
        },
        {
          status: 401,
          description: "Non authentifié",
          schema: ErrorResponseSchemaDto,
        },
        {
          status: 403,
          description: "Accès refusé (rôle non admin)",
          schema: ErrorResponseSchemaDto,
        },
        {
          status: 404,
          description: "Utilisateur introuvable",
          schema: ErrorResponseSchemaDto,
        },
        {
          status: 422,
          description:
            "Données invalides, corps vide, champs incompatibles avec le rôle, ou contrainte d’unicité",
          schema: ErrorResponseSchemaDto,
        },
      ],
    }),
  );
}

export function ApiSetPermanentOtp() {
  return buildDecorator({
    summary: "Définir ou retirer l'OTP permanent d'un utilisateur",
    description:
      "Réservé aux comptes USER. Le code reste valable à chaque vérification OTP de ce numéro, sans expirer et sans être consommé. null retire l'OTP permanent. Le code n'est plus renvoyé après enregistrement.",
    responses: [
      {
        status: 200,
        description: "OTP permanent mis à jour",
        schema: UserResponseSchemaDto,
      },
      {
        status: 401,
        description: "Non authentifié",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 403,
        description: "Permission ou périmètre refusé",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 404,
        description: "Utilisateur introuvable",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 422,
        description: "Code invalide ou compte sans téléphone",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}
