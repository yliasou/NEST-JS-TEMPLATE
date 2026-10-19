import "dotenv/config";
import { AdminLevel, PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString })),
});

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@app.local";
/** Mot de passe de démo : à surcharger via SEED_ADMIN_PASSWORD hors local. */
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

const SEED_USERS = [
  {
    email: SEED_ADMIN_EMAIL,
    role: Role.ADMIN,
    firstName: "Admin",
    lastName: "App",
    adminLevel: AdminLevel.ADMIN,
  },
  {
    email: "user.demo@app.local",
    role: Role.USER,
    firstName: "Demo",
    lastName: "User",
    adminLevel: null,
  },
] as const;

async function main() {
  console.log("🌱 Seed — démarrage");
  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);

  for (const seed of SEED_USERS) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: { role: seed.role },
      create: {
        email: seed.email,
        passwordHash,
        role: seed.role,
        emailVerifiedAt: new Date(),
      },
      select: { id: true },
    });

    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: { firstName: seed.firstName, lastName: seed.lastName },
      create: {
        userId: user.id,
        firstName: seed.firstName,
        lastName: seed.lastName,
      },
    });

    if (seed.adminLevel) {
      await prisma.adminProfile.upsert({
        where: { userId: user.id },
        update: { level: seed.adminLevel },
        create: { userId: user.id, level: seed.adminLevel },
      });
    }

    console.log(`  ✓ ${seed.role} ${seed.email}`);
  }

  console.log("🌱 Seed terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
