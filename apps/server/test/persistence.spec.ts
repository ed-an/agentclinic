import { execFile } from 'node:child_process';
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
    return { migrations, tables };
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

  it('applies the baseline migration and safely reapplies it', async () => {
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
    expect(stateAfterSecondDeploy.tables).toEqual(['_prisma_migrations']);
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
  });

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
