import 'dotenv/config';
import { defineConfig } from '@prisma/config';

/**
 * Railway peut exécuter `prisma generate` en phase build sans injecter `DATABASE_URL`.
 * On fournit une URL PostgreSQL de fallback uniquement pour la génération du client.
 */
const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  'postgresql://postgres:postgres@localhost:5432/postgres?schema=public';

export default defineConfig({
  schema: 'prisma/',
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
});
