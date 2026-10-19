import type { Gender } from "@prisma/client";

/** Champs stricts pour l'authentification locale — une requête, sans relations lourdes. */
export const localLoginUserSelect = {
  id: true,
  email: true,
  phone: true,
  avatarUrl: true,
  role: true,
  passwordHash: true,
  authProvider: true,
  isActive: true,
  deletedAt: true,
  dateOfBirth: true,
  gender: true,
  residentialAddress: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  profile: {
    select: { firstName: true, lastName: true },
  },
} as const;

export const adminLoginUserSelect = {
  ...localLoginUserSelect,
  adminProfile: {
    select: { level: true },
  },
} as const;

export type LocalLoginUser = {
  id: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  passwordHash: string;
  authProvider: string;
  isActive: boolean;
  deletedAt: Date | null;
  dateOfBirth: Date | null;
  gender: Gender | null;
  residentialAddress: string | null;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  profile: { firstName: string; lastName: string } | null;
  adminProfile?: { level: string } | null;
};
