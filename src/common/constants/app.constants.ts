/** Signature affichée dans la bannière de démarrage. */
export const APP_BRAND = "TheFlow";

/** Nom affiché dans Swagger, la bannière et les e-mails. À renommer pour chaque projet. */
export const APP_NAME = "TheFlow NestJS Template";

/**
 * Préfixe des clés Redis écrites directement (OTP, verrous, révocations, cache).
 * À renommer pour isoler plusieurs projets partageant le même Redis.
 */
export const REDIS_KEY_PREFIX = "app";
