import { REDIS_KEY_PREFIX } from "../../../common/constants/app.constants";
export { AUTH_OTP_CODE_LENGTH } from "../../shared/auth-validation.constants";

export const AUTH_OTP_BCRYPT_ROUNDS = 10;
export const AUTH_OTP_KEY_OTP = `${REDIS_KEY_PREFIX}:auth:otp`;
export const AUTH_OTP_KEY_PENDING = `${REDIS_KEY_PREFIX}:auth:pending`;
export const AUTH_OTP_KEY_RESEND = `${REDIS_KEY_PREFIX}:auth:resend`;
export const AUTH_OTP_KEY_ATTEMPTS = `${REDIS_KEY_PREFIX}:auth:otp-attempts`;

/** Échecs tolérés par numéro avant blocage (OTP à usage unique et OTP permanent). */
export const AUTH_OTP_MAX_FAILED_ATTEMPTS = 5;
export const AUTH_OTP_LOCK_WINDOW_SEC = 15 * 60;
