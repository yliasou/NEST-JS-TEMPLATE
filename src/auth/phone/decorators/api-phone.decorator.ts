import { ApiDocumentation } from "../../../common/decorators/api-documentation.decorator";
import { AuthOtpStartedResponseSchemaDto } from "../../otp/dto/auth-otp-started-response.dto";
import { AuthRegisterLoginResponseSchemaDto } from "../../session/dto/auth-response.dto";
import { ErrorResponseSchemaDto } from "../../../common/dto/response-schemas.dto";
import { PasswordResetVerifyResponseSchemaDto } from "../../otp/dto/password-reset-verify-response.dto";
import { VerifyCodeResponseSchemaDto } from "../../otp/dto/verify-code-response.dto";

export function ApiAuthSendCode() {
  return ApiDocumentation({
    operation: {
      summary: "Téléphone — envoi du code OTP",
      description:
        "Parcours téléphone. `phone_number` (E.164) : compte existant → `EXISTING_ACCOUNT`, numéro inconnu → `NEW_ACCOUNT`. Un compte désactivé est refusé. Réponse : `data.request_type`, `data.security`. 503 si aucun fournisseur SMS n'est branché (hors mode dev OTP_LOG_CODE / OTP_RETURN_CODE_IN_RESPONSE).",
    },
    responses: [
      {
        status: 200,
        description: "Code envoyé",
        schema: AuthOtpStartedResponseSchemaDto,
      },
      {
        status: 401,
        description: "Compte désactivé",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 422,
        description: "Numéro invalide ou délai de renvoi",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 503,
        description: "Service temporairement indisponible",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiAuthVerifyCode() {
  return ApiDocumentation({
    operation: {
      summary: "Téléphone — validation du code OTP",
      description:
        "Parcours téléphone. `security` + `code` reçu par SMS. Pour `NEW_ACCOUNT` / `PASSWORD_RESET`, renvoie le même `security` à utiliser avec `register` / `change-password`. Un jeton du parcours e-mail est refusé.",
    },
    responses: [
      {
        status: 200,
        description: "Code OTP validé",
        schema: VerifyCodeResponseSchemaDto,
      },
      {
        status: 422,
        description: "Jeton ou code invalide",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 503,
        description: "Service temporairement indisponible",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiRegister() {
  return ApiDocumentation({
    operation: {
      summary: "Téléphone — inscription",
      description:
        "Après `send-code` + `verify-code` : `security`, `phone_number` (identique à send-code), `first_name`, `last_name`, `secret_code` ; `email`, `date_of_birth`, `gender`, `residential_address` optionnels. Le téléphone est marqué vérifié ; un e-mail fourni ici reste non vérifié.",
    },
    responses: [
      {
        status: 201,
        description: "Compte créé",
        schema: AuthRegisterLoginResponseSchemaDto,
      },
      {
        status: 422,
        description: "Données invalides ou compte déjà existant",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 503,
        description: "Service temporairement indisponible",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiAuthForgotPassword() {
  return ApiDocumentation({
    operation: {
      summary: "Téléphone — mot de passe oublié",
      description:
        "`phone_number` du compte. Envoie un code par SMS. Puis `verify-code` (`PASSWORD_RESET`) et `change-password`.",
    },
    responses: [
      {
        status: 200,
        description: "Code envoyé",
        schema: AuthOtpStartedResponseSchemaDto,
      },
      {
        status: 422,
        description: "Numéro inconnu, compte inéligible, ou délai de renvoi",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 503,
        description: "Service temporairement indisponible",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiAuthChangePassword() {
  return ApiDocumentation({
    operation: {
      summary: "Téléphone — nouveau mot de passe",
      description:
        "`security` validé par `verify-code` (flux `PASSWORD_RESET` par SMS) et nouveau `secret_code`.",
    },
    responses: [
      {
        status: 200,
        description: "Mot de passe mis à jour",
        schema: PasswordResetVerifyResponseSchemaDto,
      },
      {
        status: 422,
        description: "Jeton invalide ou données invalides",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 503,
        description: "Service temporairement indisponible",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiLogin() {
  return ApiDocumentation({
    operation: {
      summary: "Téléphone — connexion",
      description: "Connexion avec `phone_number` et `secret_code` (code PIN).",
    },
    responses: [
      {
        status: 200,
        description: "Connexion réussie",
        schema: AuthRegisterLoginResponseSchemaDto,
      },
      {
        status: 401,
        description: "Identifiants incorrects",
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
