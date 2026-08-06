import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/client';
import { getDatabaseUrl } from '../src/database/database-url';

async function seed(): Promise<void> {
  const adapter = new PrismaBetterSqlite3({ url: getDatabaseUrl() });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log(
      'Persistent foundation is ready; no domain records are seeded in Phase 2.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch(() => {
  console.error(
    'Unable to seed the persistent foundation. Verify DATABASE_URL points to a writable, migrated SQLite database.',
  );
  process.exitCode = 1;
});
