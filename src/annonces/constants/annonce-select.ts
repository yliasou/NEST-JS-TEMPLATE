import { Prisma } from "@prisma/client";

export const ANNONCE_SELECT = {
  id: true,
  title: true,
  description: true,
  imageUrls: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AnnonceSelect;

/** Select public — ex. latest-unread. */
export const ANNONCE_PUBLIC_SELECT = {
  id: true,
  title: true,
  description: true,
  imageUrls: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AnnonceSelect;
