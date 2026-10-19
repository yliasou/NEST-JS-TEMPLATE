import { Role } from "@prisma/client";
import type { AnnoncesQueryDto } from "../dto/annonces-query.dto";

/** Seul l'admin voit les annonces inactives. Utilisateurs et public : actives uniquement. */
export function seesInactiveAnnonces(role?: Role): boolean {
  return role === Role.ADMIN;
}

export function annoncesQueryForRole(
  query: AnnoncesQueryDto,
  role?: Role,
): AnnoncesQueryDto {
  if (seesInactiveAnnonces(role)) return query;
  return { ...query, isActive: true };
}
