import { SetMetadata } from "@nestjs/common";
import type { Role } from "@prisma/client";
import { ROLES_KEY } from "./roles.constants";

/**
 * RBAC : rôles requis pour la route (enum Prisma `Role`, aligné sur `User.role`).
 * Exemple: `@Roles(Role.ADMIN)`
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
