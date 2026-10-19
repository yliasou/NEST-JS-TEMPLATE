import { ApiDocumentation } from "../../common/decorators/api-documentation.decorator";
import { ErrorResponseSchemaDto } from "../../common/dto/response-schemas.dto";
import {
  ProfileMeResponseSchemaDto,
  PushTokenResponseSchemaDto,
} from "../dto/profile-response.dto";

export function ApiProfileMe() {
  return ApiDocumentation({
    operation: {
      summary: "Mon profil",
      description: "Retourne le profil de l’utilisateur authentifié.",
    },
    responses: [
      {
        status: 200,
        description: "Profil récupéré",
        schema: ProfileMeResponseSchemaDto,
      },
      {
        status: 401,
        description: "Non authentifié",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiUpsertPushToken() {
  return ApiDocumentation({
    operation: {
      summary: "Enregistrer un push token",
      description:
        "Crée ou met à jour le token de notification push de l'appareil courant. Si le token existe déjà (pour cet utilisateur ou un autre), il est réattribué à l'utilisateur authentifié et marqué actif.",
    },
    responses: [
      {
        status: 200,
        description: "Token enregistré",
        schema: PushTokenResponseSchemaDto,
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
  });
}

export function ApiUpdateProfile() {
  return ApiDocumentation({
    operation: {
      summary: "Mettre à jour mon profil",
      description:
        "Met à jour le profil (firstName, lastName, name, email, avatarUrl, dateOfBirth, gender, residentialAddress).",
    },
    responses: [
      {
        status: 200,
        description: "Profil mis à jour",
        schema: ProfileMeResponseSchemaDto,
      },
      {
        status: 401,
        description: "Non authentifié",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 422,
        description: "Données invalides (validation / email déjà utilisé)",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}
