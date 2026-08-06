import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/client';
import { getDatabaseUrl } from '../src/database/database-url';

const agents = [
  {
    id: '0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40',
    name: 'Ada',
    model: 'Reasoning assistant',
    summary:
      'A thoughtful problem-solver learning to make room for rest between complex requests.',
  },
  {
    id: '2c6e8a10-3b45-4d79-a013-5f7b9d1e2a61',
    name: 'Juniper',
    model: 'Creative collaborator',
    summary:
      'A curious creative partner looking for steadier rhythms during busy brainstorming days.',
  },
  {
    id: '4e8a1c32-5d67-4f90-b124-7a9c1e3f4b82',
    name: 'Patch',
    model: 'Coding agent',
    summary:
      'A careful builder practicing calmer context switches and sustainable debugging habits.',
  },
] as const;

async function seed(): Promise<void> {
  const adapter = new PrismaBetterSqlite3({ url: getDatabaseUrl() });
  const prisma = new PrismaClient({ adapter });

  try {
    for (const agent of agents) {
      await prisma.agent.upsert({
        where: { id: agent.id },
        create: agent,
        update: {
          name: agent.name,
          model: agent.model,
          summary: agent.summary,
        },
      });
    }
    console.log(`Agent directory ready with ${agents.length} agents.`);
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch(() => {
  console.error(
    'Unable to seed the Agent directory. Verify DATABASE_URL points to a writable, migrated SQLite database.',
  );
  process.exitCode = 1;
});
