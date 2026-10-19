import { ApiDocumentation } from "../../../common/decorators/api-documentation.decorator";
import {
  AuthRefreshResponseSchemaDto,
  AuthRegisterLoginResponseSchemaDto,
} from "../dto/auth-response.dto";
import { ErrorResponseSchemaDto } from "../../../common/dto/response-schemas.dto";

export function ApiAdminLogin() {
  return ApiDocumentation({
    operation: {
      summary: "Connexion admin",
      description:
        "Connexion réservée aux comptes `ADMIN` avec `email` et `password`.",
    },
    responses: [
      {
        status: 200,
        description: "Connexion réussie",
        schema: AuthRegisterLoginResponseSchemaDto,
      },
      {
        status: 401,
        description: "Identifiants admin incorrects",
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

export function ApiRefreshToken() {
  return ApiDocumentation({
    operation: {
      summary: "Rafraîchir les tokens",
      description:
        "Envoie le token de rafraîchissement pour obtenir de nouveaux tokens d’accès.",
    },
    responses: [
      {
        status: 200,
        description: "Nouveaux tokens générés",
        schema: AuthRefreshResponseSchemaDto,
      },
      {
        status: 422,
        description: "Token manquant, invalide ou expiré",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiLogout() {
  return ApiDocumentation({
    operation: {
      summary: "Déconnexion",
      description:
        "Invalide le token d’accès (Authorization Bearer) et, si fourni, le `refresh_token`. " +
        "Les tokens révoqués ne peuvent plus être utilisés pour les requêtes API ni le rafraîchissement.",
    },
    responses: [
      {
        status: 200,
        description: "Déconnexion réussie",
      },
      {
        status: 401,
        description: "Non authentifié ou token manquant",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}
