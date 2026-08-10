import { execFileSync, spawn } from 'node:child_process';
import { randomBytes, randomInt, scryptSync } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import Database from 'better-sqlite3';

const repositoryRoot = new URL('..', import.meta.url).pathname;
const directory = mkdtempSync(join(tmpdir(), 'agentclinic-performance-'));
const databaseUrl = `file:${join(directory, 'performance.db')}`;
const defaultPort = randomInt(35_000, 45_000);
const apiPort = Number(process.env.PERFORMANCE_API_PORT ?? defaultPort);
const webPort = Number(process.env.PERFORMANCE_WEB_PORT ?? defaultPort + 1);
const apiOrigin = `http://127.0.0.1:${apiPort}`;
const webOrigin = `http://127.0.0.1:${webPort}`;
const password = randomBytes(48).toString('base64url');
const children = [];
const baseline = JSON.parse(
  readFileSync(new URL('./performance-baseline.json', import.meta.url), 'utf8'),
);
const baseEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) =>
      !name.startsWith('AGENTCLINIC_') &&
      !['DATABASE_URL', 'NODE_ENV', 'PORT'].includes(name),
  ),
);

function verifier() {
  return Object.fromEntries(
    ['staff', 'ada', 'juniper', 'patch'].map((name) => {
      const salt = randomBytes(32);
      const key = scryptSync(password, salt, 64, {
        N: 2 ** 17,
        r: 8,
        p: 1,
        maxmem: 256 * 1024 * 1024,
      });
      return [
        `${name}@demo.agentclinic.test`,
        `scrypt-v1$131072$8$1$${salt.toString('base64url')}$${key.toString('base64url')}`,
      ];
    }),
  );
}

function verifySeed() {
  const database = new Database(join(directory, 'performance.db'), {
    readonly: true,
  });
  try {
    const row = database
      .prepare('SELECT passwordHash FROM UserAccount WHERE email = ?')
      .get('ada@demo.agentclinic.test');
    if (!row || typeof row.passwordHash !== 'string')
      throw new Error('PERFORMANCE_SEED_ACCOUNT_MISSING');
    const [version, n, r, p, saltText, keyText] = row.passwordHash.split('$');
    const actual = scryptSync(
      password,
      Buffer.from(saltText, 'base64url'),
      64,
      {
        N: Number(n),
        r: Number(r),
        p: Number(p),
        maxmem: 256 * 1024 * 1024,
      },
    );
    if (version !== 'scrypt-v1' || actual.toString('base64url') !== keyText)
      throw new Error('PERFORMANCE_SEED_VERIFIER_INVALID');
  } finally {
    database.close();
  }
}

function start(command, args, env) {
  const child = spawn(command, args, {
    cwd: repositoryRoot,
    env: { ...baseEnvironment, ...env },
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.safeDiagnostics = [];
  const collectSafeDiagnostic = (chunk) => {
    for (const line of String(chunk).split('\n')) {
      try {
        const parsed = JSON.parse(line);
        child.safeDiagnostics.push({
          event: parsed.event,
          code: parsed.errorCode,
        });
      } catch {
        const sanitized = line
          .replace(/file:\S+/g, '[redacted-path]')
          .replace(/\S+@\S+/g, '[redacted-email]')
          .replace(
            /(DATABASE_URL|PASSWORD|TOKEN|SECRET|COOKIE|AUTHORIZATION)=\S+/gi,
            '$1=[redacted]',
          )
          .trim();
        if (sanitized && child.safeDiagnostics.length < 20)
          child.safeDiagnostics.push({ message: sanitized.slice(0, 200) });
      }
    }
  };
  child.stdout.on('data', collectSafeDiagnostic);
  child.stderr.on('data', collectSafeDiagnostic);
  children.push(child);
  return child;
}

async function waitFor(url, child) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      throw new Error(
        `PERFORMANCE_PROCESS_EXITED_${child.exitCode}:${JSON.stringify(child.safeDiagnostics)}`,
      );
    }
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('PERFORMANCE_STARTUP_TIMEOUT');
}

function cookies(response) {
  return response.headers
    .getSetCookie()
    .map((value) => value.split(';', 1)[0])
    .join('; ');
}

async function signIn(email) {
  const response = await fetch(`${apiOrigin}/auth/sign-in`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: webOrigin },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok)
    throw new Error(`PERFORMANCE_SIGN_IN_FAILED_${response.status}`);
  return cookies(response);
}

function percentile(values, value) {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.max(0, Math.ceil(ordered.length * value) - 1)];
}

async function measure({
  name,
  url,
  cookie,
  budget,
  samples = 10,
  concurrency = 2,
}) {
  for (let warmup = 0; warmup < 2; warmup++)
    await fetch(url, { headers: cookie ? { cookie } : undefined });
  const durations = [];
  let failures = 0;
  const started = performance.now();
  for (let offset = 0; offset < samples; offset += concurrency) {
    await Promise.all(
      Array.from(
        { length: Math.min(concurrency, samples - offset) },
        async () => {
          const requestStart = performance.now();
          const response = await fetch(url, {
            headers: cookie ? { cookie } : undefined,
            signal: AbortSignal.timeout(5_000),
          });
          durations.push(performance.now() - requestStart);
          if (!response.ok) failures++;
          await response.arrayBuffer();
        },
      ),
    );
  }
  const elapsed = performance.now() - started;
  const report = {
    name,
    samples,
    concurrency,
    p50: Number(percentile(durations, 0.5).toFixed(2)),
    p95: Number(percentile(durations, 0.95).toFixed(2)),
    maximum: Number(Math.max(...durations).toFixed(2)),
    throughput: Number((samples / (elapsed / 1000)).toFixed(2)),
    errorRate: failures / samples,
    budget,
    baselineP95: baseline.routes[name],
    regressionCeiling: Number(
      Math.max(baseline.routes[name] * 1.2, baseline.noiseFloor[name]).toFixed(
        2,
      ),
    ),
  };
  if (
    failures ||
    report.p95 > budget ||
    report.maximum > 5_000 ||
    report.p95 > report.regressionCeiling
  )
    throw new Error(
      `PERFORMANCE_BUDGET_FAILED:${name}:${JSON.stringify(report)}`,
    );
  return report;
}

function stop() {
  for (const child of children) {
    if (child.killed || child.pid === undefined) continue;
    try {
      if (process.platform === 'win32') child.kill('SIGTERM');
      else process.kill(-child.pid, 'SIGTERM');
    } catch (error) {
      if (error?.code !== 'ESRCH') throw error;
    }
  }
  rmSync(directory, { recursive: true, force: true });
}

try {
  execFileSync('npm', ['run', 'build'], {
    cwd: repositoryRoot,
    env: { ...baseEnvironment, AGENTCLINIC_API_URL: apiOrigin },
    stdio: 'ignore',
  });
  execFileSync('npm', ['run', 'db:migrate:deploy'], {
    cwd: repositoryRoot,
    env: { ...baseEnvironment, DATABASE_URL: databaseUrl },
    stdio: 'ignore',
  });
  execFileSync('npm', ['run', 'db:seed'], {
    cwd: repositoryRoot,
    env: {
      ...baseEnvironment,
      DATABASE_URL: databaseUrl,
      AGENTCLINIC_ENABLE_DEMO_ACCOUNTS: 'true',
      AGENTCLINIC_DEMO_PASSWORD_HASHES: JSON.stringify(verifier()),
    },
    stdio: 'ignore',
  });
  verifySeed();
  const server = start(process.execPath, ['apps/server/dist/main.js'], {
    NODE_ENV: 'production',
    PORT: String(apiPort),
    DATABASE_URL: databaseUrl,
    AGENTCLINIC_WEB_ORIGIN: webOrigin,
    AGENTCLINIC_HTTPS: 'true',
    AGENTCLINIC_ENABLE_DEMO_ACCOUNTS: 'false',
  });
  await waitFor(`${apiOrigin}/health/ready`, server);
  const agentCookie = await signIn('ada@demo.agentclinic.test');
  const staffCookie = await signIn('staff@demo.agentclinic.test');
  const web = start(
    process.execPath,
    [
      'node_modules/next/dist/bin/next',
      'start',
      'apps/web',
      '-p',
      String(webPort),
    ],
    {
      NODE_ENV: 'production',
      AGENTCLINIC_API_URL: apiOrigin,
      AGENTCLINIC_HTTPS: 'true',
    },
  );
  await waitFor(webOrigin, web);
  const routes = [
    { name: 'agents-api', url: `${apiOrigin}/agents`, budget: 300 },
    {
      name: 'agent-dashboard-api',
      url: `${apiOrigin}/agent/appointments/upcoming`,
      cookie: agentCookie,
      budget: 400,
    },
    {
      name: 'staff-queue-api',
      url: `${apiOrigin}/staff/appointments`,
      cookie: staffCookie,
      budget: 400,
    },
    { name: 'home-page', url: webOrigin, budget: 1_000 },
    {
      name: 'appointments-page',
      url: `${webOrigin}/appointments`,
      budget: 1_000,
    },
  ];
  const results = [];
  for (const route of routes) results.push(await measure(route));
  process.stdout.write(
    `${JSON.stringify({ environment: `node-${process.version}-${process.platform}-${process.arch}`, mode: 'production-build', warmup: 2, results })}\n`,
  );
} finally {
  stop();
}
