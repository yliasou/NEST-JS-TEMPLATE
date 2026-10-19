import { Prisma } from "@prisma/client";

export const NEWSLETTER_SUBSCRIBER_SELECT = {
  id: true,
  email: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NewsletterSubscriberSelect;
