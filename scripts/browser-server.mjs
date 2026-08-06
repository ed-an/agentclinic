import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.BROWSER_SERVER_PORT ?? 3201);
const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const databaseDirectory = mkdtempSync(join(tmpdir(), 'agentclinic-browser-'));
const databaseUrl = `file:${join(databaseDirectory, 'browser.db')}`;
let server;

function cleanup() {
  if (server && !server.killed) server.kill('SIGTERM');
  rmSync(databaseDirectory, { recursive: true, force: true });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    cleanup();
    process.exit(signal === 'SIGINT' ? 130 : 143);
  });
}

try {
  execFileSync('npm', ['run', 'db:migrate:deploy'], {
    cwd: repositoryRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
  execFileSync('npm', ['run', 'db:seed'], {
    cwd: repositoryRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
  server = spawn(
    'npm',
    ['run', 'start', '--workspace', '@agentclinic/server'],
    {
      cwd: repositoryRoot,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        PORT: String(port),
      },
      stdio: 'inherit',
    },
  );
  server.on('exit', (code) => {
    cleanup();
    process.exit(code ?? 1);
  });
} catch (error) {
  cleanup();
  throw error;
}
