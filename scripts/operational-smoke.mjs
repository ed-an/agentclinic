import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

const root = new URL('..', import.meta.url).pathname;
const directory = mkdtempSync(join(tmpdir(), 'agentclinic-operations-'));
const databaseUrl = `file:${join(directory, 'operations.db')}`;
const port = Number(process.env.OPERATIONS_PORT ?? 3401);
const origin = 'https://clinic.example.test';
let child;
let output = '';
const baseEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) =>
      !name.startsWith('AGENTCLINIC_') &&
      !['DATABASE_URL', 'NODE_ENV', 'PORT'].includes(name),
  ),
);

function cleanup() {
  if (child && child.exitCode === null) child.kill('SIGKILL');
  rmSync(directory, { recursive: true, force: true });
}

async function waitForReady() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health/ready`);
      if (response.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('OPERATIONS_STARTUP_TIMEOUT');
}

try {
  execFileSync('npm', ['run', 'build', '--workspace', '@agentclinic/server'], {
    cwd: root,
    stdio: 'ignore',
  });
  execFileSync('npm', ['run', 'db:migrate:deploy'], {
    cwd: root,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'ignore',
  });
  const unsafeStartup = spawnSync(
    process.execPath,
    ['apps/server/dist/main.js'],
    {
      cwd: root,
      env: {
        ...baseEnvironment,
        NODE_ENV: 'production',
        DATABASE_URL: databaseUrl,
        AGENTCLINIC_HTTPS: 'true',
      },
      encoding: 'utf8',
    },
  );
  if (unsafeStartup.status === 0)
    throw new Error('OPERATIONS_UNSAFE_STARTUP_ACCEPTED');
  const startupOutput = `${unsafeStartup.stdout}${unsafeStartup.stderr}`;
  if (!startupOutput.trim())
    throw new Error(
      `OPERATIONS_UNSAFE_STARTUP_EMPTY_${String(unsafeStartup.status)}_${String(unsafeStartup.signal)}`,
    );
  const startupEvents = startupOutput
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  if (
    !startupEvents.some(
      ({ event, errorCode }) =>
        event === 'lifecycle.startup.failed' &&
        errorCode === 'CONFIG_ORIGINS_REQUIRED',
    ) ||
    startupOutput.includes(databaseUrl)
  )
    throw new Error('OPERATIONS_UNSAFE_STARTUP_REPORT_FAILED');
  child = spawn(process.execPath, ['apps/server/dist/main.js'], {
    cwd: root,
    env: {
      ...baseEnvironment,
      NODE_ENV: 'production',
      PORT: String(port),
      DATABASE_URL: databaseUrl,
      AGENTCLINIC_WEB_ORIGIN: origin,
      AGENTCLINIC_HTTPS: 'true',
      AGENTCLINIC_SHUTDOWN_TIMEOUT_MS: '5000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => (output += chunk.toString()));
  child.stderr.on('data', (chunk) => (output += chunk.toString()));
  await waitForReady();
  const valid = await fetch(`http://127.0.0.1:${port}/health/live`, {
    headers: { 'x-request-id': 'approved-request-id' },
  });
  if (
    valid.headers.get('x-request-id') !== 'approved-request-id' ||
    valid.headers.get('x-content-type-options') !== 'nosniff' ||
    !valid.headers.get('strict-transport-security')
  )
    throw new Error('OPERATIONS_HEADERS_FAILED');
  const malformed = await fetch(
    `http://127.0.0.1:${port}/missing?private=forbidden`,
    {
      headers: { 'x-request-id': 'forged value' },
    },
  );
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(
      malformed.headers.get('x-request-id') ?? '',
    )
  )
    throw new Error('OPERATIONS_REQUEST_ID_FAILED');
  child.kill('SIGTERM');
  const exitCode = await new Promise((resolve) => child.once('exit', resolve));
  if (exitCode !== 0) throw new Error('OPERATIONS_SHUTDOWN_FAILED');
  const lines = output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  if (!lines.some(({ event }) => event === 'lifecycle.started'))
    throw new Error('OPERATIONS_START_LOG_MISSING');
  if (!lines.some(({ event }) => event === 'lifecycle.shutdown.completed'))
    throw new Error('OPERATIONS_SHUTDOWN_LOG_MISSING');
  if (output.includes('private=forbidden') || output.includes('forged'))
    throw new Error('OPERATIONS_LOG_PRIVACY_FAILED');
  process.stdout.write(
    `${JSON.stringify({ status: 'ok', events: lines.length, gracefulExit: exitCode })}\n`,
  );
} finally {
  cleanup();
}
