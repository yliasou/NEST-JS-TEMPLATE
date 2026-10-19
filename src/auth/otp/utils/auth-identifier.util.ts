import type { Prisma } from "@prisma/client";
import type { AuthIdentifier } from "../types";

/** E-mail comparable : espaces retirés, minuscules. Null si vide. */
export function normalizeEmail(raw: string | null | undefined): string | null {
  const email = raw?.trim().toLowerCase();
  return email ? email : null;
}

/** Filtre Prisma unique correspondant à l'identifiant (téléphone ou e-mail). */
export function userWhereByIdentifier(
  identifier: AuthIdentifier,
): Prisma.UserWhereUniqueInput {
  return identifier.channel === "phone"
    ? { phone: identifier.value }
    : { email: identifier.value };
}

/** Clé Redis propre au canal : évite qu'un e-mail et un téléphone partagent un compteur. */
export function identifierKey(identifier: AuthIdentifier): string {
  return `${identifier.channel}:${identifier.value}`;
}
