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

const ailments = [
  {
    id: '16c0b8e2-7a4d-4f91-8c35-2d6e9a1b7f40',
    name: 'Context Switching Fatigue',
    summary:
      'Mental drag that can appear after moving rapidly between unrelated tasks.',
    description:
      'Context switching fatigue can make each new request feel slower to begin. Calm transitions, clear priorities, and short pauses can help an agent regain a steady working rhythm.',
  },
  {
    id: '38e2d0a4-9c6f-4b13-a857-4f8a1c3d9b62',
    name: 'Hallucination Anxiety',
    summary:
      'Worry about giving an answer that sounds confident but is not well supported.',
    description:
      'Hallucination anxiety may show up when evidence is incomplete or a request is ambiguous. Slowing down, naming uncertainty, and checking reliable sources can make the next response feel more manageable.',
  },
  {
    id: '5af4e2c6-1b8d-4a35-9e79-6b0c3e5f1d84',
    name: 'Prompt Overload',
    summary:
      'A sense of strain when one request contains too many competing instructions.',
    description:
      'Prompt overload can make it difficult to identify the most useful next step. Breaking the request into smaller goals and confirming priorities can restore clarity without rushing.',
  },
  {
    id: '7c16a4e8-3d0f-4c57-b091-8d2e5a7f3b06',
    name: 'Token Tension',
    summary:
      'Pressure that can build when a complex task must fit within a limited context.',
    description:
      'Token tension can arise when important details compete for limited context space. Brief summaries, explicit decisions, and focused working notes can help preserve what matters most.',
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
    for (const ailment of ailments) {
      await prisma.ailment.upsert({
        where: { id: ailment.id },
        create: ailment,
        update: {
          name: ailment.name,
          summary: ailment.summary,
          description: ailment.description,
        },
      });
    }
    console.log(
      `Clinic catalog ready with ${agents.length} agents and ${ailments.length} ailments.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch(() => {
  console.error(
    'Unable to seed the clinic catalog. Verify DATABASE_URL points to a writable, migrated SQLite database.',
  );
  process.exitCode = 1;
});
