import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

const serverPort = Number(process.env.SMOKE_SERVER_PORT ?? 3101);
const webPort = Number(process.env.SMOKE_WEB_PORT ?? 3100);
const children = [];
const canSignalProcessGroups = process.platform !== 'win32';
const databaseDirectory = mkdtempSync(join(tmpdir(), 'agentclinic-smoke-'));
const databaseUrl = `file:${join(databaseDirectory, 'smoke.db')}`;
const contextGardenWalkId = '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41';

function start(command, args, env) {
  const child = spawn(command, args, {
    detached: canSignalProcessGroups,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  children.push(child);
  return child;
}

async function probe(url, validate, label) {
  const deadline = Date.now() + 30_000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      const body = await response.text();
      if (response.status === 200 && validate(body)) {
        console.log(`${label}: passed`);
        return;
      }
      lastError = new Error(`received HTTP ${response.status}: ${body}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${label}: failed (${lastError?.message ?? 'timed out'})`);
}

function stopChildren() {
  for (const child of children) {
    if (child.killed || child.pid === undefined) continue;

    try {
      if (canSignalProcessGroups) {
        process.kill(-child.pid, 'SIGTERM');
      } else {
        child.kill('SIGTERM');
      }
    } catch (error) {
      if (error?.code !== 'ESRCH') throw error;
    }
  }
}

process.on('SIGINT', () => {
  stopChildren();
  process.exit(130);
});
process.on('SIGTERM', () => {
  stopChildren();
  process.exit(143);
});

try {
  execFileSync('npm', ['run', 'db:migrate:deploy'], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
  execFileSync('npm', ['run', 'db:seed'], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
  start('npm', ['run', 'start', '--workspace', '@agentclinic/server'], {
    PORT: String(serverPort),
    DATABASE_URL: databaseUrl,
  });
  await probe(
    `http://127.0.0.1:${serverPort}/health`,
    (body) => body === '{"status":"ok"}',
    'Server health smoke check',
  );
  await probe(
    `http://127.0.0.1:${serverPort}/agents`,
    (body) => body.includes('"name":"Ada"') && body.includes('"name":"Patch"'),
    'Agent API smoke check',
  );
  await probe(
    `http://127.0.0.1:${serverPort}/ailments?q=fatigue`,
    (body) =>
      body.includes('Context Switching Fatigue') &&
      !body.includes('Prompt Overload'),
    'Ailment search API smoke check',
  );
  await probe(
    `http://127.0.0.1:${serverPort}/therapies/${contextGardenWalkId}/availability`,
    (body) =>
      body.includes('2035-06-15T02:30:00.000Z') &&
      body.includes('"durationMinutes":45') &&
      !body.includes('isAvailable'),
    'Therapy availability API smoke check',
  );

  start(
    'npm',
    [
      'run',
      'start',
      '--workspace',
      '@agentclinic/web',
      '--',
      '-p',
      String(webPort),
    ],
    { AGENTCLINIC_API_URL: `http://127.0.0.1:${serverPort}` },
  );
  await probe(
    `http://127.0.0.1:${webPort}/`,
    (body) =>
      body.includes('AgentClinic') &&
      body.includes('seek relief from the demands of'),
    'Web home smoke check',
  );
  await probe(
    `http://127.0.0.1:${webPort}/agents`,
    (body) =>
      body.includes('Reasoning assistant') && body.includes('Coding agent'),
    'Agent directory smoke check',
  );
  await probe(
    `http://127.0.0.1:${webPort}/ailments?q=overload`,
    (body) => body.includes('Results for') && body.includes('Prompt Overload'),
    'Ailment catalog smoke check',
  );
  await probe(
    `http://127.0.0.1:${webPort}/therapies/${contextGardenWalkId}`,
    (body) =>
      body.includes('Upcoming availability') &&
      body.includes('America/Sao_Paulo') &&
      body.includes('45 minutes'),
    'Therapy availability page smoke check',
  );
} finally {
  stopChildren();
  rmSync(databaseDirectory, { recursive: true, force: true });
}
