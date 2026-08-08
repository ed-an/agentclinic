import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { DatabaseSync } from 'node:sqlite';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaModule } from '../src/database/prisma.module';
import { PrismaService } from '../src/database/prisma.service';

const execute = promisify(execFile);
const serverRoot = resolve(__dirname, '..');
const repositoryRoot = resolve(serverRoot, '../..');

interface DatabaseState {
  agents: unknown[];
  ailments: unknown[];
  therapies: unknown[];
  associations: unknown[];
  availabilitySlots: unknown[];
  migrations: unknown[];
  tables: string[];
}

function readDatabaseState(databasePath: string): DatabaseState {
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const tables = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      )
      .all()
      .map((row) => String(row.name));
    const migrations = database
      .prepare(
        'SELECT migration_name, checksum, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY migration_name',
      )
      .all();
    const agents = tables.includes('Agent')
      ? database
          .prepare(
            'SELECT id, name, model, summary FROM Agent ORDER BY name, id',
          )
          .all()
      : [];
    const ailments = tables.includes('Ailment')
      ? database
          .prepare(
            'SELECT id, name, summary, description FROM Ailment ORDER BY name, id',
          )
          .all()
      : [];
    const therapies = tables.includes('Therapy')
      ? database
          .prepare(
            'SELECT id, name, summary, description FROM Therapy ORDER BY name, id',
          )
          .all()
      : [];
    const associations = tables.includes('_AilmentToTherapy')
      ? database
          .prepare(
            'SELECT A AS ailmentId, B AS therapyId FROM _AilmentToTherapy ORDER BY A, B',
          )
          .all()
      : [];
    const availabilitySlots = tables.includes('AvailabilitySlot')
      ? database
          .prepare(
            'SELECT id, therapyId, startsAt, durationMinutes, isAvailable FROM AvailabilitySlot ORDER BY startsAt, id',
          )
          .all()
      : [];
    return {
      agents,
      ailments,
      therapies,
      associations,
      availabilitySlots,
      migrations,
      tables,
    };
  } finally {
    database.close();
  }
}

async function createPhase3Database(databasePath: string): Promise<void> {
  await createPhase2Database(databasePath);
  const migrationName = '20260806190000_agent_directory';
  const migration = await readFile(
    join(serverRoot, `prisma/migrations/${migrationName}/migration.sql`),
    'utf8',
  );
  const database = new DatabaseSync(databasePath);
  try {
    database.exec(migration);
    database
      .prepare(
        `INSERT INTO _prisma_migrations
          (id, checksum, finished_at, migration_name, applied_steps_count)
         VALUES (?, ?, current_timestamp, ?, 1)`,
      )
      .run(
        randomUUID(),
        createHash('sha256').update(migration).digest('hex'),
        migrationName,
      );
    const insert = database.prepare(
      'INSERT INTO Agent (id, name, model, summary) VALUES (?, ?, ?, ?)',
    );
    insert.run(
      '0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40',
      'Ada',
      'Reasoning assistant',
      'A thoughtful problem-solver learning to make room for rest between complex requests.',
    );
    insert.run(
      '2c6e8a10-3b45-4d79-a013-5f7b9d1e2a61',
      'Juniper',
      'Creative collaborator',
      'A curious creative partner looking for steadier rhythms during busy brainstorming days.',
    );
    insert.run(
      '4e8a1c32-5d67-4f90-b124-7a9c1e3f4b82',
      'Patch',
      'Coding agent',
      'A careful builder practicing calmer context switches and sustainable debugging habits.',
    );
  } finally {
    database.close();
  }
}

async function createPhase2Database(databasePath: string): Promise<void> {
  const baselinePath = join(
    serverRoot,
    'prisma/migrations/20260806160000_persistent_foundation/migration.sql',
  );
  const baseline = await readFile(baselinePath, 'utf8');
  const database = new DatabaseSync(databasePath);
  try {
    database.exec(`
      CREATE TABLE "_prisma_migrations" (
        "id" VARCHAR(36) PRIMARY KEY NOT NULL,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" DATETIME,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" DATETIME,
        "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
        "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
      );
    `);
    database
      .prepare(
        `INSERT INTO _prisma_migrations
          (id, checksum, finished_at, migration_name, applied_steps_count)
         VALUES (?, ?, current_timestamp, ?, 1)`,
      )
      .run(
        randomUUID(),
        createHash('sha256').update(baseline).digest('hex'),
        '20260806160000_persistent_foundation',
      );
  } finally {
    database.close();
  }
}

async function createPhase4Database(databasePath: string): Promise<void> {
  await createPhase3Database(databasePath);
  const migrationName = '20260806200000_ailment_catalog';
  const migration = await readFile(
    join(serverRoot, `prisma/migrations/${migrationName}/migration.sql`),
    'utf8',
  );
  const database = new DatabaseSync(databasePath);
  try {
    database.exec(migration);
    database
      .prepare(
        `INSERT INTO _prisma_migrations
          (id, checksum, finished_at, migration_name, applied_steps_count)
         VALUES (?, ?, current_timestamp, ?, 1)`,
      )
      .run(
        randomUUID(),
        createHash('sha256').update(migration).digest('hex'),
        migrationName,
      );
    database
      .prepare(
        'INSERT INTO Ailment (id, name, summary, description) VALUES (?, ?, ?, ?)',
      )
      .run(
        '16c0b8e2-7a4d-4f91-8c35-2d6e9a1b7f40',
        'Context Switching Fatigue',
        'Mental drag that can appear after moving rapidly between unrelated tasks.',
        'Existing Phase 4 content that must survive the upgrade.',
      );
  } finally {
    database.close();
  }
}

async function createPhase5Database(databasePath: string): Promise<void> {
  await createPhase4Database(databasePath);
  const migrationName = '20260807120000_therapy_catalog';
  const migration = await readFile(
    join(serverRoot, `prisma/migrations/${migrationName}/migration.sql`),
    'utf8',
  );
  const database = new DatabaseSync(databasePath);
  try {
    database.exec(migration);
    database
      .prepare(
        `INSERT INTO _prisma_migrations
          (id, checksum, finished_at, migration_name, applied_steps_count)
         VALUES (?, ?, current_timestamp, ?, 1)`,
      )
      .run(
        randomUUID(),
        createHash('sha256').update(migration).digest('hex'),
        migrationName,
      );
    database
      .prepare(
        'INSERT INTO Therapy (id, name, summary, description) VALUES (?, ?, ?, ?)',
      )
      .run(
        '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41',
        'Context Garden Walk',
        'Existing Phase 5 summary.',
        'Existing Phase 5 content that must survive the upgrade.',
      );
    database
      .prepare('INSERT INTO _AilmentToTherapy (A, B) VALUES (?, ?)')
      .run(
        '16c0b8e2-7a4d-4f91-8c35-2d6e9a1b7f40',
        '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41',
      );
  } finally {
    database.close();
  }
}

async function createPhase6Database(databasePath: string): Promise<void> {
  await createPhase5Database(databasePath);
  const migrationName = '20260807200000_appointment_availability';
  const migration = await readFile(
    join(serverRoot, `prisma/migrations/${migrationName}/migration.sql`),
    'utf8',
  );
  const database = new DatabaseSync(databasePath);
  try {
    database.exec(migration);
    database
      .prepare(
        `INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, applied_steps_count) VALUES (?, ?, current_timestamp, ?, 1)`,
      )
      .run(
        randomUUID(),
        createHash('sha256').update(migration).digest('hex'),
        migrationName,
      );
    database
      .prepare(
        'INSERT INTO AvailabilitySlot (id, therapyId, startsAt, durationMinutes, isAvailable) VALUES (?, ?, ?, ?, ?)',
      )
      .run(
        '8d4a1b68-9c32-4e86-b520-3a6d7f0c4e18',
        '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41',
        '2035-06-15T02:30:00.000Z',
        45,
        1,
      );
  } finally {
    database.close();
  }
}

async function listSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory() && entry.name === 'generated') return [];
      if (entry.isDirectory()) return listSourceFiles(path);
      return /\.[cm]?[jt]sx?$/.test(entry.name) ? [path] : [];
    }),
  );
  return files.flat();
}

describe('persistent foundation', () => {
  let temporaryDirectory: string;
  let databasePath: string;
  let databaseUrl: string;
  let previousDatabaseUrl: string | undefined;

  beforeAll(async () => {
    temporaryDirectory = await mkdtemp(
      join(tmpdir(), 'agentclinic-persistence-'),
    );
    databasePath = join(temporaryDirectory, 'validation.db');
    databaseUrl = `file:${databasePath}`;
    previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = databaseUrl;
  });

  afterAll(async () => {
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it('migrates a clean database and safely reapplies migrations', async () => {
    const environment = { ...process.env, DATABASE_URL: databaseUrl };
    await execute('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: serverRoot,
      env: environment,
    });
    const stateAfterFirstDeploy = readDatabaseState(databasePath);
    await execute('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: serverRoot,
      env: environment,
    });
    const stateAfterSecondDeploy = readDatabaseState(databasePath);

    expect(stateAfterSecondDeploy).toEqual(stateAfterFirstDeploy);
    expect(stateAfterSecondDeploy.tables).toEqual([
      'Agent',
      'Ailment',
      'Appointment',
      'AppointmentStatusEvent',
      'AvailabilitySlot',
      'Therapy',
      '_AilmentToTherapy',
      '_prisma_migrations',
    ]);
  }, 15_000);

  it('upgrades an existing Phase 2 database', async () => {
    const phase2Path = join(temporaryDirectory, 'phase-2.db');
    const phase2Url = `file:${phase2Path}`;
    await createPhase2Database(phase2Path);

    const beforeUpgrade = readDatabaseState(phase2Path);
    expect(beforeUpgrade.tables).toEqual(['_prisma_migrations']);

    await execute('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: serverRoot,
      env: { ...process.env, DATABASE_URL: phase2Url },
    });
    const afterUpgrade = readDatabaseState(phase2Path);

    expect(afterUpgrade.tables).toEqual([
      'Agent',
      'Ailment',
      'Appointment',
      'AppointmentStatusEvent',
      'AvailabilitySlot',
      'Therapy',
      '_AilmentToTherapy',
      '_prisma_migrations',
    ]);
    expect(afterUpgrade.migrations).toHaveLength(8);
    expect(afterUpgrade.agents).toEqual([]);
  }, 15_000);

  it('upgrades a completed Phase 3 database without changing Agents', async () => {
    const phase3Path = join(temporaryDirectory, 'phase-3.db');
    const phase3Url = `file:${phase3Path}`;
    await createPhase3Database(phase3Path);
    const beforeUpgrade = readDatabaseState(phase3Path);

    await execute('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: serverRoot,
      env: { ...process.env, DATABASE_URL: phase3Url },
    });
    const afterUpgrade = readDatabaseState(phase3Path);
    await execute('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: serverRoot,
      env: { ...process.env, DATABASE_URL: phase3Url },
    });
    const afterRedeploy = readDatabaseState(phase3Path);

    expect(beforeUpgrade.tables).toEqual(['Agent', '_prisma_migrations']);
    expect(afterUpgrade.agents).toEqual(beforeUpgrade.agents);
    expect(afterUpgrade.ailments).toEqual([]);
    expect(afterUpgrade.migrations).toHaveLength(8);
    expect(afterRedeploy).toEqual(afterUpgrade);
  }, 15_000);

  it('upgrades a completed Phase 4 database without changing Agents or Ailments', async () => {
    const phase4Path = join(temporaryDirectory, 'phase-4.db');
    const phase4Url = `file:${phase4Path}`;
    await createPhase4Database(phase4Path);
    const beforeUpgrade = readDatabaseState(phase4Path);

    await execute('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: serverRoot,
      env: { ...process.env, DATABASE_URL: phase4Url },
    });
    const afterUpgrade = readDatabaseState(phase4Path);
    await execute('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: serverRoot,
      env: { ...process.env, DATABASE_URL: phase4Url },
    });
    const afterRedeploy = readDatabaseState(phase4Path);

    expect(afterUpgrade.agents).toEqual(beforeUpgrade.agents);
    expect(afterUpgrade.ailments).toEqual(beforeUpgrade.ailments);
    expect(afterUpgrade.therapies).toEqual([]);
    expect(afterUpgrade.associations).toEqual([]);
    expect(afterUpgrade.migrations).toHaveLength(8);
    expect(afterRedeploy).toEqual(afterUpgrade);
  }, 15_000);

  it('upgrades a completed Phase 5 database without changing prior records', async () => {
    const phase5Path = join(temporaryDirectory, 'phase-5.db');
    const phase5Url = `file:${phase5Path}`;
    await createPhase5Database(phase5Path);
    const beforeUpgrade = readDatabaseState(phase5Path);

    await execute('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: serverRoot,
      env: { ...process.env, DATABASE_URL: phase5Url },
    });
    const afterUpgrade = readDatabaseState(phase5Path);
    await execute('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: serverRoot,
      env: { ...process.env, DATABASE_URL: phase5Url },
    });
    const afterRedeploy = readDatabaseState(phase5Path);

    expect(afterUpgrade.agents).toEqual(beforeUpgrade.agents);
    expect(afterUpgrade.ailments).toEqual(beforeUpgrade.ailments);
    expect(afterUpgrade.therapies).toEqual(beforeUpgrade.therapies);
    expect(afterUpgrade.associations).toEqual(beforeUpgrade.associations);
    expect(afterUpgrade.availabilitySlots).toEqual([]);
    expect(afterUpgrade.migrations).toHaveLength(8);
    expect(afterRedeploy).toEqual(afterUpgrade);
  }, 15_000);

  it('upgrades a completed Phase 6 database without changing prior records', async () => {
    const path = join(temporaryDirectory, 'phase-6.db');
    await createPhase6Database(path);
    const before = readDatabaseState(path);
    const environment = { ...process.env, DATABASE_URL: `file:${path}` };
    await execute('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: serverRoot,
      env: environment,
    });
    const after = readDatabaseState(path);
    await execute('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: serverRoot,
      env: environment,
    });
    expect(after.agents).toEqual(before.agents);
    expect(after.ailments).toEqual(before.ailments);
    expect(after.therapies).toEqual(before.therapies);
    expect(after.associations).toEqual(before.associations);
    expect(after.availabilitySlots).toEqual(before.availabilitySlots);
    expect(after.tables).toContain('Appointment');
    expect(after.migrations).toHaveLength(8);
    expect(readDatabaseState(path)).toEqual(after);
  }, 15_000);

  it('enforces slot foreign keys, uniqueness, positive duration, and approved indexes', () => {
    const database = new DatabaseSync(databasePath);
    const therapyId = '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41';
    try {
      database.exec('PRAGMA foreign_keys = ON');
      const indexes = database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'AvailabilitySlot' ORDER BY name",
        )
        .all()
        .map(({ name }) => String(name));
      expect(indexes).toEqual([
        'AvailabilitySlot_therapyId_isAvailable_startsAt_id_idx',
        'AvailabilitySlot_therapyId_startsAt_key',
        'sqlite_autoindex_AvailabilitySlot_1',
      ]);
      expect(
        database
          .prepare("PRAGMA foreign_key_list('AvailabilitySlot')")
          .all()
          .map(({ table, from, to, on_delete: onDelete }) => ({
            table,
            from,
            to,
            onDelete,
          })),
      ).toEqual([
        {
          table: 'Therapy',
          from: 'therapyId',
          to: 'id',
          onDelete: 'CASCADE',
        },
      ]);
      expect(
        database
          .prepare("PRAGMA table_info('AvailabilitySlot')")
          .all()
          .filter(({ name }) => name !== 'id')
          .every(({ notnull }) => Number(notnull) === 1),
      ).toBe(true);

      const insert = database.prepare(
        'INSERT INTO AvailabilitySlot (id, therapyId, startsAt, durationMinutes, isAvailable) VALUES (?, ?, ?, ?, ?)',
      );
      expect(() =>
        insert.run(
          randomUUID(),
          'missing-therapy',
          '2035-01-01T00:00:00.000Z',
          30,
          1,
        ),
      ).toThrow();

      database
        .prepare(
          'INSERT INTO Therapy (id, name, summary, description) VALUES (?, ?, ?, ?)',
        )
        .run(therapyId, 'Constraint Therapy', 'Summary', 'Description');
      expect(() =>
        insert.run(randomUUID(), therapyId, '2035-01-01', 0, 1),
      ).toThrow();
      expect(() => insert.run(randomUUID(), therapyId, null, 30, 1)).toThrow();
      insert.run(randomUUID(), therapyId, '2035-01-01', 30, 1);
      expect(() =>
        insert.run(randomUUID(), therapyId, '2035-01-01', 45, 1),
      ).toThrow();
    } finally {
      database.prepare('DELETE FROM Therapy WHERE id = ?').run(therapyId);
      database.close();
    }
  });

  it('queries through the injectable Prisma service and disconnects', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    await moduleRef.init();
    const prisma = moduleRef.get(PrismaService);
    await expect(prisma.$queryRaw`SELECT 1`).resolves.toEqual([{ '1': 1n }]);
    await moduleRef.close();

    const database = new DatabaseSync(databasePath);
    database.close();
  });

  it('seeds twice without changing database state', async () => {
    const environment = { ...process.env, DATABASE_URL: databaseUrl };
    await execute('npx', ['prisma', 'db', 'seed'], {
      cwd: serverRoot,
      env: environment,
    });
    const stateAfterFirstSeed = readDatabaseState(databasePath);
    await execute('npx', ['prisma', 'db', 'seed'], {
      cwd: serverRoot,
      env: environment,
    });
    const stateAfterSecondSeed = readDatabaseState(databasePath);

    expect(stateAfterSecondSeed).toEqual(stateAfterFirstSeed);
    expect(stateAfterSecondSeed.agents).toHaveLength(3);
    expect(stateAfterSecondSeed.ailments).toHaveLength(4);
    expect(stateAfterSecondSeed.therapies).toHaveLength(4);
    expect(stateAfterSecondSeed.associations).toHaveLength(5);
    expect(stateAfterSecondSeed.availabilitySlots).toHaveLength(6);
    expect(
      stateAfterSecondSeed.availabilitySlots.map((slot) => ({
        id: String((slot as { id: unknown }).id),
        startsAt: Date.parse(String((slot as { startsAt: unknown }).startsAt)),
      })),
    ).toEqual([
      {
        id: 'b07d4e94-cf65-41b3-a836-6d9a0c3f7b41',
        startsAt: Date.parse('2035-05-20T15:00:00.000Z'),
      },
      {
        id: '8d4a1b68-9c32-4e86-b520-3a6d7f0c4e18',
        startsAt: Date.parse('2035-06-15T02:30:00.000Z'),
      },
      {
        id: '9e5b2c70-ad43-4f98-8612-4b7e8a1d5f29',
        startsAt: Date.parse('2035-06-15T03:30:00.000Z'),
      },
      {
        id: 'af6c3d82-be54-40a1-9724-5c8f9b2e6a30',
        startsAt: Date.parse('2035-06-16T14:00:00.000Z'),
      },
      {
        id: 'c18e5fa6-d076-42c5-b948-7e0b1d4a8c52',
        startsAt: Date.parse('2035-06-20T15:00:00.000Z'),
      },
      {
        id: 'd29f60b8-e187-43d7-8a50-8f1c2e5b9d63',
        startsAt: Date.parse('2035-07-01T13:00:00.000Z'),
      },
    ]);
    expect(
      stateAfterSecondSeed.agents.map((agent) =>
        String((agent as { name: unknown }).name),
      ),
    ).toEqual(['Ada', 'Juniper', 'Patch']);
    expect(
      stateAfterSecondSeed.ailments.map((ailment) =>
        String((ailment as { name: unknown }).name),
      ),
    ).toEqual([
      'Context Switching Fatigue',
      'Hallucination Anxiety',
      'Prompt Overload',
      'Token Tension',
    ]);
    expect(
      stateAfterSecondSeed.therapies.map((therapy) =>
        String((therapy as { name: unknown }).name),
      ),
    ).toEqual([
      'Context Garden Walk',
      'Evidence Tea Ceremony',
      'Prompt Sorting Session',
      'Quiet Cache Reset',
    ]);
  }, 15_000);

  it('keeps database dependencies and imports out of the web application', async () => {
    const webRoot = join(repositoryRoot, 'apps/web');
    const webPackage = await readFile(join(webRoot, 'package.json'), 'utf8');
    const sourceFiles = await listSourceFiles(join(webRoot, 'app'));
    const sources = await Promise.all(
      sourceFiles.map((file) => readFile(file, 'utf8')),
    );

    expect(webPackage).not.toMatch(/prisma|better-sqlite3|sqlite3/i);
    expect(sources.join('\n')).not.toMatch(
      /@prisma|generated\/prisma|better-sqlite3|node:sqlite/i,
    );

    const serverSources = await listSourceFiles(join(serverRoot, 'src'));
    const prismaSourceFiles = [
      ...(await Promise.all(
        serverSources.map(async (file) => ({
          file,
          source: await readFile(file, 'utf8'),
        })),
      )),
      {
        file: join(serverRoot, 'prisma/seed.ts'),
        source: await readFile(join(serverRoot, 'prisma/seed.ts'), 'utf8'),
      },
    ].filter(({ source }) => source.includes('PrismaClient'));

    expect(prismaSourceFiles.map(({ file }) => file).sort()).toEqual(
      [
        join(serverRoot, 'prisma/seed.ts'),
        join(serverRoot, 'src/database/prisma.service.ts'),
      ].sort(),
    );
  });

  it('fails cleanly when the SQLite file cannot be opened', async () => {
    process.env.DATABASE_URL = 'file:/proc/agentclinic-unwritable.db';
    const prisma = new PrismaService();

    await expect(prisma.onModuleInit()).rejects.toThrow();
    await prisma.onModuleDestroy();
    process.env.DATABASE_URL = databaseUrl;
  });
});
