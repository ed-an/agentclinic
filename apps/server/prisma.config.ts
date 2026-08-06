import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl = process.env.DATABASE_URL?.trim() || 'file:./prisma/dev.db';

if (!databaseUrl.startsWith('file:') || databaseUrl === 'file:') {
  throw new Error('DATABASE_URL must be a non-empty SQLite file: URL.');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node --import tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
});
