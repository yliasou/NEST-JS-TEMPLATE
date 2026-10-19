import { UnauthorizedException } from "@nestjs/common";
import type { Role } from "@prisma/client";
import type { Request } from "express";
import type { Locale } from "../i18n";

/** Payload JWT posé sur `req.user` par `JwtAuthGuard`. */
export type AuthUser = {
  id?: string;
  sub?: string;
  role?: Role;
};

export type AuthedRequest = Request & {
  locale?: Locale;
  user?: AuthUser;
};

type RequestWithUserId = { user?: Pick<AuthUser, "id" | "sub"> };

/** Identifiant de l'utilisateur connecté, `undefined` sur une route publique sans token. */
export function getUserId(req: RequestWithUserId): string | undefined {
  return req.user?.id ?? req.user?.sub;
}

export function requireUserId(req: RequestWithUserId): string {
  const userId = getUserId(req);
  if (!userId) {
    throw new UnauthorizedException("Missing user id in request context");
  }
  return userId;
}

export function requireUser(req: Pick<AuthedRequest, "user">): {
  userId: string;
  role: Role;
} {
  const userId = requireUserId(req);
  const role = req.user?.role;
  if (!role) {
    throw new UnauthorizedException("Missing user role in request context");
  }
  return { userId, role };
}
