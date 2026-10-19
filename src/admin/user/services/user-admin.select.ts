import { Prisma } from "@prisma/client";

/** Rounds bcrypt pour création / mise à jour mot de passe (aligné auth registration). */
export const USERS_BCRYPT_ROUNDS = 10;

/** Sélection Prisma commune pour les réponses admin utilisateur. */
export const USER_ADMIN_SELECT = {
  id: true,
  email: true,
  phone: true,
  avatarUrl: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  permanentOtpHash: true,
  createdAt: true,
  updatedAt: true,
  adminProfile: {
    select: {
      id: true,
      level: true,
      department: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  profile: {
    select: {
      firstName: true,
      lastName: true,
      preferredLanguage: true,
    },
  },
} satisfies Prisma.UserSelect;

/** Sélection légère pour la liste des utilisateurs connectés (dashboard). */
export const CONNECTED_USER_SELECT = {
  id: true,
  email: true,
  phone: true,
  avatarUrl: true,
  role: true,
  lastLoginAt: true,
  lastRequestAt: true,
  profile: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.UserSelect;

export type ConnectedUserRow = Prisma.UserGetPayload<{
  select: typeof CONNECTED_USER_SELECT;
}>;

export type UserAdminRow = Prisma.UserGetPayload<{
  select: typeof USER_ADMIN_SELECT;
}>;

export function normalizeConnectedUser(u: ConnectedUserRow) {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    role: u.role,
    lastLoginAt: u.lastLoginAt,
    lastRequestAt: u.lastRequestAt,
    profile: u.profile
      ? {
          firstName: u.profile.firstName,
          lastName: u.profile.lastName,
        }
      : null,
  };
}

export function normalizeUserAdmin(u: UserAdminRow) {
  const ap = u.adminProfile;
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    hasPermanentOtp: Boolean(u.permanentOtpHash),
    lastLoginAt: u.lastLoginAt,
    avatarUrl: u.avatarUrl,
    adminProfile: ap
      ? {
          id: ap.id,
          level: ap.level,
          department: ap.department,
          createdAt: ap.createdAt,
          updatedAt: ap.updatedAt,
        }
      : null,
    firstName: u.profile?.firstName ?? null,
    lastName: u.profile?.lastName ?? null,
    fullName:
      [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(" ") ||
      null,
    profile: u.profile
      ? {
          firstName: u.profile.firstName,
          lastName: u.profile.lastName,
          preferredLanguage: u.profile.preferredLanguage,
        }
      : null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}
