import { CheckEmailResponseSchemaDto } from "../dto/check-email.dto";
import { ApiDocumentation } from "../../../common/decorators/api-documentation.decorator";
import {
  ErrorResponseSchemaDto,
  SuccessResponseSchemaDto,
} from "../../../common/dto/response-schemas.dto";
import { AuthOtpStartedResponseSchemaDto } from "../../otp/dto/auth-otp-started-response.dto";
import { AuthRegisterLoginResponseSchemaDto } from "../../session/dto/auth-response.dto";
import {
  EmailRegisterResponseSchemaDto,
  EmailVerifiedResponseSchemaDto,
} from "../dto/email-register-response.dto";

const invalid = {
  status: 422,
  description: "Données invalides",
  schema: ErrorResponseSchemaDto,
};
const unavailable = {
  status: 503,
  description: "Envoi d'e-mail indisponible (SMTP non configuré)",
  schema: ErrorResponseSchemaDto,
};

export function ApiEmailRegister() {
  return ApiDocumentation({
    operation: {
      summary: "E-mail — inscription",
      description:
        "Crée le compte avec `email` + `password` (8 caractères min.), `first_name`, `last_name` ; `phone_number`, `date_of_birth`, `gender`, `residential_address` optionnels. Renvoie les tokens et envoie un code de vérification par e-mail (`data.email_verification.security`). L'e-mail reste non vérifié tant que `POST /auth/email/verify` n'a pas été appelé.",
    },
    responses: [
      {
        status: 201,
        description: "Compte créé",
        schema: EmailRegisterResponseSchemaDto,
      },
      {
        status: 422,
        description: "Données invalides, e-mail ou téléphone déjà utilisé",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiEmailLogin() {
  return ApiDocumentation({
    operation: {
      summary: "E-mail — connexion",
      description:
        "Connexion avec `email` + `password`. Possible avant vérification : `user.emailVerified` indique l'état.",
    },
    responses: [
      {
        status: 200,
        description: "Connexion réussie",
        schema: AuthRegisterLoginResponseSchemaDto,
      },
      {
        status: 401,
        description: "Identifiants incorrects ou compte désactivé",
        schema: ErrorResponseSchemaDto,
      },
      invalid,
    ],
  });
}

export function ApiEmailVerify() {
  return ApiDocumentation({
    operation: {
      summary: "E-mail — vérification de l'adresse",
      description:
        "`security` (reçu à l'inscription ou via `resend-verification`) + `code` reçu par e-mail. Marque l'e-mail comme vérifié.",
    },
    responses: [
      {
        status: 200,
        description: "E-mail vérifié",
        schema: EmailVerifiedResponseSchemaDto,
      },
      {
        status: 422,
        description: "Jeton ou code invalide, ou e-mail modifié depuis l'envoi",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiEmailResendVerification() {
  return ApiDocumentation({
    operation: {
      summary: "E-mail — renvoyer le code de vérification",
      description:
        "Authentifié (JWT). Envoie un nouveau code à l'e-mail du compte connecté. Refusé si l'e-mail est déjà vérifié ou absent.",
    },
    responses: [
      {
        status: 200,
        description: "Code envoyé",
        schema: AuthOtpStartedResponseSchemaDto,
      },
      {
        status: 401,
        description: "Non authentifié",
        schema: ErrorResponseSchemaDto,
      },
      {
        status: 422,
        description: "E-mail déjà vérifié, absent, ou délai de renvoi",
        schema: ErrorResponseSchemaDto,
      },
      unavailable,
    ],
  });
}

export function ApiEmailForgotPassword() {
  return ApiDocumentation({
    operation: {
      summary: "E-mail — mot de passe oublié",
      description:
        "`email` du compte. Envoie un code par e-mail ; puis `POST /auth/email/reset-password` avec `security`, `code` et le nouveau `password`.",
    },
    responses: [
      {
        status: 200,
        description: "Code envoyé",
        schema: AuthOtpStartedResponseSchemaDto,
      },
      {
        status: 422,
        description: "Compte introuvable ou délai de renvoi",
        schema: ErrorResponseSchemaDto,
      },
      unavailable,
    ],
  });
}

export function ApiEmailResetPassword() {
  return ApiDocumentation({
    operation: {
      summary: "E-mail — nouveau mot de passe",
      description:
        "`security` (forgot-password) + `code` reçu par e-mail + nouveau `password` (8 caractères min.), en une seule étape.",
    },
    responses: [
      {
        status: 200,
        description: "Mot de passe mis à jour",
        schema: SuccessResponseSchemaDto,
      },
      {
        status: 422,
        description: "Jeton ou code invalide, ou mot de passe trop court",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}

export function ApiAuthCheckEmail() {
  return ApiDocumentation({
    operation: {
      summary: "Vérifier si un e-mail existe déjà",
      description:
        "Route publique. Query `email` : renvoie `data.exists` (`true` si un compte utilise déjà cette adresse). Utile avant inscription / édition de profil.",
    },
    responses: [
      {
        status: 200,
        description: "Vérification effectuée",
        schema: CheckEmailResponseSchemaDto,
      },
      {
        status: 422,
        description: "E-mail invalide",
        schema: ErrorResponseSchemaDto,
      },
    ],
  });
}
