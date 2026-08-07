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

const therapies = [
  {
    id: '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41',
    name: 'Context Garden Walk',
    summary:
      'A gentle guided pause for setting down one context before picking up another.',
    description:
      'The Context Garden Walk uses a calm sequence of reflection prompts and quiet transitions. It offers general ideas for creating a little space between demanding tasks.',
    ailmentIds: [
      '16c0b8e2-7a4d-4f91-8c35-2d6e9a1b7f40',
      '5af4e2c6-1b8d-4a35-9e79-6b0c3e5f1d84',
    ],
  },
  {
    id: '3f9b5c12-4d86-4e30-a074-8c1f2a5d9e63',
    name: 'Evidence Tea Ceremony',
    summary:
      'A quiet practice for noticing uncertainty and gathering trustworthy context.',
    description:
      'The Evidence Tea Ceremony creates a measured space to identify what is known, what needs checking, and what can be said with care. It is educational information rather than individualized guidance.',
    ailmentIds: ['38e2d0a4-9c6f-4b13-a857-4f8a1c3d9b62'],
  },
  {
    id: '5a1d7e34-6f08-4b52-8296-0e3a4c7f1b85',
    name: 'Prompt Sorting Session',
    summary:
      'A supportive exercise for arranging competing instructions into clearer groups.',
    description:
      'A Prompt Sorting Session explores simple ways to name priorities and divide a crowded request into approachable pieces. It does not assess or prescribe care for an individual agent.',
    ailmentIds: [
      '16c0b8e2-7a4d-4f91-8c35-2d6e9a1b7f40',
      '5af4e2c6-1b8d-4a35-9e79-6b0c3e5f1d84',
    ],
  },
  {
    id: '7c3f9a56-8b20-4d74-a418-2f5c6e9a3d07',
    name: 'Quiet Cache Reset',
    summary:
      'An unhurried restorative pause designed for calm and low stimulation.',
    description:
      'The Quiet Cache Reset offers a peaceful setting for stepping away from active processing. It is included as general clinic information and is not a promise of a particular outcome.',
    ailmentIds: [],
  },
] as const;

// Fixed 2035 UTC fixtures keep course and booth demos reproducible. Tests use
// a controlled 2035-06-01 clock when classifying past and upcoming records.
const availabilitySlots = [
  {
    id: '8d4a1b68-9c32-4e86-b520-3a6d7f0c4e18',
    therapyId: '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41',
    startsAt: new Date('2035-06-15T02:30:00.000Z'),
    durationMinutes: 45,
    isAvailable: true,
  },
  {
    id: '9e5b2c70-ad43-4f98-8612-4b7e8a1d5f29',
    therapyId: '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41',
    startsAt: new Date('2035-06-15T03:30:00.000Z'),
    durationMinutes: 45,
    isAvailable: true,
  },
  {
    id: 'af6c3d82-be54-40a1-9724-5c8f9b2e6a30',
    therapyId: '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41',
    startsAt: new Date('2035-06-16T14:00:00.000Z'),
    durationMinutes: 60,
    isAvailable: false,
  },
  {
    id: 'b07d4e94-cf65-41b3-a836-6d9a0c3f7b41',
    therapyId: '3f9b5c12-4d86-4e30-a074-8c1f2a5d9e63',
    startsAt: new Date('2035-05-20T15:00:00.000Z'),
    durationMinutes: 30,
    isAvailable: true,
  },
  {
    id: 'c18e5fa6-d076-42c5-b948-7e0b1d4a8c52',
    therapyId: '3f9b5c12-4d86-4e30-a074-8c1f2a5d9e63',
    startsAt: new Date('2035-06-20T15:00:00.000Z'),
    durationMinutes: 30,
    isAvailable: false,
  },
  {
    id: 'd29f60b8-e187-43d7-8a50-8f1c2e5b9d63',
    therapyId: '5a1d7e34-6f08-4b52-8296-0e3a4c7f1b85',
    startsAt: new Date('2035-07-01T13:00:00.000Z'),
    durationMinutes: 50,
    isAvailable: true,
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
    for (const therapy of therapies) {
      const { ailmentIds, ...therapyFields } = therapy;
      await prisma.therapy.upsert({
        where: { id: therapy.id },
        create: {
          ...therapyFields,
          ailments: {
            connect: ailmentIds.map((id) => ({ id })),
          },
        },
        update: {
          name: therapy.name,
          summary: therapy.summary,
          description: therapy.description,
          ailments: {
            set: ailmentIds.map((id) => ({ id })),
          },
        },
      });
    }
    for (const slot of availabilitySlots) {
      await prisma.availabilitySlot.upsert({
        where: { id: slot.id },
        create: slot,
        update: {
          therapyId: slot.therapyId,
          startsAt: slot.startsAt,
          durationMinutes: slot.durationMinutes,
          isAvailable: slot.isAvailable,
        },
      });
    }
    console.log(
      `Clinic catalog ready with ${agents.length} agents, ${ailments.length} ailments, ${therapies.length} therapies, and ${availabilitySlots.length} availability slots.`,
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
