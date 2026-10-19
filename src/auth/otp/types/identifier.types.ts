/** Canal par lequel l'OTP est envoyé et le compte identifié. */
export type AuthOtpChannel = "phone" | "email";

/** Identifiant normalisé : téléphone E.164 ou e-mail en minuscules. */
export type AuthIdentifier = {
  channel: AuthOtpChannel;
  value: string;
};
