import {
  normalizePhoneE164,
  normalizePhoneInput,
} from "../../auth/phone/utils/phone-normalize.util";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

/**
 * Identifiant d'auth présent dans body/query pour un second bucket de rate-limit
 * (indépendant de l'IP : une rotation d'IP ne réinitialise pas le compteur).
 *
 * Formats : `email:ada@example.com` | `phone:+33612345678`
 */
export function extractAuthThrottleIdentity(req: {
  body?: unknown;
  query?: unknown;
}): string | null {
  const body = isRecord(req.body) ? req.body : {};
  const query = isRecord(req.query) ? req.query : {};

  const emailRaw = firstString(body.email, query.email);
  if (emailRaw) {
    const email = emailRaw.trim().toLowerCase();
    if (email.includes("@") && email.length <= 255) {
      return `email:${email}`;
    }
  }

  const phoneRaw = firstString(
    body.phone_number,
    body.phone,
    query.phone_number,
    query.phone,
  );
  if (phoneRaw) {
    const e164 = normalizePhoneE164(phoneRaw);
    const phone = (e164 ?? normalizePhoneInput(phoneRaw)).toLowerCase();
    if (phone.replace(/\D/g, "").length >= 8) {
      return `phone:${phone}`;
    }
  }

  return null;
}
