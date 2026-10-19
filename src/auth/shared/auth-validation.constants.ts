/** Longueur du code OTP (SMS ou e-mail). */
export const AUTH_OTP_CODE_LENGTH = 4;

/** Longueur minimale du mot de passe (secret_code) à la connexion applicative. */
export const AUTH_SECRET_CODE_MIN_LENGTH = 4;

/** Code PIN d'un utilisateur applicatif (parcours téléphone) : exactement 4 chiffres. */
export const ADMIN_APP_USER_PASSWORD_LENGTH = 4;

/** Mot de passe d'un compte créé par e-mail. */
export const AUTH_EMAIL_PASSWORD_MIN_LENGTH = 8;

/** Mot de passe staff (admin). */
export const ADMIN_STAFF_PASSWORD_MIN_LENGTH = 8;

export function isAppUserRole(role?: string | null): boolean {
  return String(role || "").toUpperCase() === "USER";
}

/** Longueur minimale acceptée (PIN de 4 chiffres pour un USER). */
export function adminUserPasswordMinLength(role?: string | null): number {
  return isAppUserRole(role)
    ? ADMIN_APP_USER_PASSWORD_LENGTH
    : ADMIN_STAFF_PASSWORD_MIN_LENGTH;
}

export const ADMIN_APP_USER_PASSWORD_MESSAGE =
  "Le mot de passe d'un utilisateur doit être un code PIN de 4 chiffres ou contenir au moins 8 caractères.";

export function isAppUserPinDigits(password: string): boolean {
  return /^\d+$/.test(password);
}

/**
 * USER : PIN de 4 chiffres (parcours téléphone) ou mot de passe de 8 caractères min. (parcours e-mail).
 * Staff : 8 caractères min.
 */
export function isAdminUserPasswordValid(
  password: string,
  role?: string | null,
): boolean {
  if (isAppUserRole(role)) {
    const isPin =
      password.length === ADMIN_APP_USER_PASSWORD_LENGTH &&
      isAppUserPinDigits(password);
    return isPin || password.length >= AUTH_EMAIL_PASSWORD_MIN_LENGTH;
  }
  return password.length >= ADMIN_STAFF_PASSWORD_MIN_LENGTH;
}

export function adminUserPasswordErrorMessage(
  password: string,
  role?: string | null,
): string {
  if (isAppUserRole(role)) {
    return ADMIN_APP_USER_PASSWORD_MESSAGE;
  }
  return `password must be longer than or equal to ${adminUserPasswordMinLength(role)} characters`;
}
