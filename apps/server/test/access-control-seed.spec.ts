import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AuthCryptoService } from '../src/auth/crypto.service';

const execute = promisify(execFile);
const serverRoot = resolve(__dirname, '..');
const emails = ['staff', 'ada', 'juniper', 'patch'].map(
  (name) => `${name}@demo.agentclinic.test`,
);
let directory: string;
let databasePath: string;
let databaseUrl: string;
let hashes: Record<string, string>;

describe('Phase 10 deterministic demo seed', () => {
  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'agentclinic-auth-seed-'));
    databasePath = join(directory, 'seed.db');
    databaseUrl = `file:${databasePath}`;
    await execute('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: serverRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
    const password = randomBytes(48).toString('base64url');
    const cryptoService = new AuthCryptoService();
    hashes = Object.fromEntries(
      await Promise.all(
        emails.map(async (email): Promise<readonly [string, string]> => [
          email,
          await cryptoService.hashPassword(password),
        ]),
      ),
    );
  });

  afterAll(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('requires explicit complete external verifier configuration', async () => {
    await expect(
      execute('npx', ['prisma', 'db', 'seed'], {
        cwd: serverRoot,
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
          AGENTCLINIC_ENABLE_DEMO_ACCOUNTS: 'true',
        },
      }),
    ).rejects.toBeDefined();
    const database = new Database(databasePath, { readonly: true });
    expect(
      (
        database.prepare('SELECT count(*) AS count FROM UserAccount').get() as {
          count: number;
        }
      ).count,
    ).toBe(0);
    database.close();
  });

  it('upserts exactly the stable approved accounts twice and creates no sessions', async () => {
    const env = {
      ...process.env,
      DATABASE_URL: databaseUrl,
      AGENTCLINIC_ENABLE_DEMO_ACCOUNTS: 'true',
      AGENTCLINIC_DEMO_PASSWORD_HASHES: JSON.stringify(hashes),
    };
    await execute('npx', ['prisma', 'db', 'seed'], { cwd: serverRoot, env });
    await execute('npx', ['prisma', 'db', 'seed'], { cwd: serverRoot, env });
    const database = new Database(databasePath, { readonly: true });
    const accounts = database
      .prepare('SELECT email, role, agentId FROM UserAccount ORDER BY email')
      .all() as Array<{ email: string; role: string; agentId: string | null }>;
    expect(accounts.map(({ email }) => email)).toEqual([...emails].sort());
    expect(
      accounts.filter(({ role, agentId }) => role === 'AGENT' && agentId),
    ).toHaveLength(3);
    expect(
      accounts.filter(
        ({ role, agentId }) => role === 'STAFF' && agentId === null,
      ),
    ).toHaveLength(1);
    expect(
      (
        database.prepare('SELECT count(*) AS count FROM AuthSession').get() as {
          count: number;
        }
      ).count,
    ).toBe(0);
    database.close();
  });
});
