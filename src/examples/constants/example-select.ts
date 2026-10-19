import { Prisma } from "@prisma/client";

export const EXAMPLE_SELECT = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ExampleSelect;

export type ExampleRow = Prisma.ExampleGetPayload<{
  select: typeof EXAMPLE_SELECT;
}>;
