/** Contexte renvoyé par verify-code selon le processus en cours. */
export enum AuthVerifyFlow {
  /** Inscription — nouveau compte. */
  NEW_ACCOUNT = "NEW_ACCOUNT",
  /** Compte déjà existant (ex. send-code). */
  EXISTING_ACCOUNT = "EXISTING_ACCOUNT",
  /** Réinitialisation du mot de passe. */
  PASSWORD_RESET = "PASSWORD_RESET",
  /** Vérification de l'e-mail d'un compte créé par e-mail + mot de passe. */
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
}
