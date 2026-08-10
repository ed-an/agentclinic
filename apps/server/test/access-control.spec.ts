import { execFile } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { AuthCryptoService } from '../src/auth/crypto.service';
import { AuthService } from '../src/auth/auth.service';
import { safeReturnPath } from '../src/auth/auth-config';
import { CurrentTimeService } from '../src/availability/current-time.service';
import { PrismaService } from '../src/database/prisma.service';

const execute = promisify(execFile);
const serverRoot = resolve(__dirname, '..');
const origin = 'http://127.0.0.1:3200';
const now = new Date('2035-06-01T12:00:00.000Z');
let clockNow = new Date(now);
const agentId = '0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40';
const otherAgentId = '2c6e8a10-3b45-4d79-a013-5f7b9d1e2a61';
let app: NestFastifyApplication;
let prisma: PrismaService;
let directory: string;
let password: string;
let agentEmail: string;
let staffEmail: string;

function cookiesFrom(response: {
  headers: Record<string, string | string[] | number | undefined>;
}): string {
  const values = response.headers['set-cookie'];
  return (
    Array.isArray(values) ? values : [typeof values === 'string' ? values : '']
  )
    .map((value) => value.split(';')[0])
    .join('; ');
}

async function signIn(email: string, suppliedPassword = password) {
  return app.inject({
    method: 'POST',
    url: '/auth/sign-in',
    headers: { origin, 'content-type': 'application/json' },
    payload: { email, password: suppliedPassword },
  });
}

describe('Phase 10 access control', () => {
  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'agentclinic-auth-'));
    process.env.DATABASE_URL = `file:${join(directory, 'auth.db')}`;
    await execute('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: serverRoot,
      env: process.env,
    });
    await execute('npx', ['prisma', 'db', 'seed'], {
      cwd: serverRoot,
      env: { ...process.env, AGENTCLINIC_ENABLE_DEMO_ACCOUNTS: 'false' },
    });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CurrentTimeService)
      .useValue({ now: () => new Date(clockNow) })
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);
    const cryptoService = app.get(AuthCryptoService);
    password = randomBytes(48).toString('base64url');
    agentEmail = `agent-${randomUUID()}@example.test`;
    staffEmail = `staff-${randomUUID()}@example.test`;
    const passwordHash = await cryptoService.hashPassword(password);
    await prisma.userAccount.createMany({
      data: [
        {
          id: randomUUID(),
          email: agentEmail,
          passwordHash,
          role: 'AGENT',
          agentId,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: randomUUID(),
          email: staffEmail,
          passwordHash: await cryptoService.hashPassword(password),
          role: 'STAFF',
          agentId: null,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });
  }, 15_000);

  beforeEach(async () => {
    clockNow = new Date(now);
    await prisma.authSession.deleteMany();
  });
  afterAll(async () => {
    await app.close();
    delete process.env.DATABASE_URL;
    await rm(directory, { recursive: true, force: true });
  });

  it('uses the approved scrypt record and validates return paths', async () => {
    const cryptoService = app.get(AuthCryptoService);
    const encoded = await cryptoService.hashPassword(password);
    expect(encoded).toMatch(/^scrypt-v1\$131072\$8\$1\$/);
    expect(await cryptoService.verifyPassword(password, encoded)).toBe(true);
    expect(await cryptoService.verifyPassword(`${password}x`, encoded)).toBe(
      false,
    );
    expect(safeReturnPath('/agent/dashboard?view=next')).toBe(
      '/agent/dashboard?view=next',
    );
    for (const unsafe of [
      'https://example.test',
      '//example.test',
      '/%2fexample.test',
      '/\\example.test',
    ])
      expect(safeReturnPath(unsafe)).toBeNull();
  });

  it('signs in generically, stores only hashes, returns safe identity, rotates, and signs out idempotently', async () => {
    await expect(
      app
        .get(AuthService)
        .signIn(
          `direct-${randomUUID()}@example.test`,
          password,
          'direct',
          null,
        ),
    ).rejects.toMatchObject({ status: 401 });
    const invalid = await signIn(
      `unknown-${randomUUID()}@example.test`,
      randomBytes(32).toString('hex'),
    );
    const wrong = await signIn(agentEmail, randomBytes(32).toString('hex'));
    expect(invalid.statusCode, invalid.body).toBe(401);
    expect(wrong.statusCode).toBe(401);
    expect(invalid.json()).toEqual(wrong.json());

    const first = await signIn(`  ${agentEmail.toUpperCase()} `);
    expect(first.statusCode, first.body).toBe(200);
    const firstCookie = cookiesFrom(first);
    expect(first.headers['set-cookie']).toBeDefined();
    const cookieHeader = JSON.stringify(first.headers['set-cookie']);
    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader).toContain('SameSite=Lax');
    expect(cookieHeader).toContain('Path=/');
    expect(cookieHeader).toContain('Max-Age=28800');
    const stored = await prisma.authSession.findFirstOrThrow();
    expect(firstCookie).not.toContain(stored.tokenHash);
    expect(firstCookie).not.toContain(stored.csrfTokenHash);
    const current = await app.inject({
      method: 'GET',
      url: '/auth/session',
      headers: { cookie: firstCookie },
    });
    expect(current.statusCode).toBe(200);
    expect(Object.keys(current.json()).sort()).toEqual([
      'accountId',
      'agent',
      'csrfToken',
      'email',
      'expiresAt',
      'role',
    ]);

    const rotated = await app.inject({
      method: 'POST',
      url: '/auth/sign-in',
      headers: { origin, cookie: firstCookie },
      payload: { email: agentEmail, password },
    });
    expect(rotated.statusCode).toBe(200);
    expect(
      await prisma.authSession.count({ where: { revokedAt: { not: null } } }),
    ).toBe(1);
    expect(
      (
        await app.inject({
          method: 'GET',
          url: '/auth/session',
          headers: { cookie: firstCookie },
        })
      ).statusCode,
    ).toBe(401);

    const rotatedBody = rotated.json<{ csrfToken: string }>();
    const rotatedCookie = cookiesFrom(rotated);
    const signOut = await app.inject({
      method: 'POST',
      url: '/auth/sign-out',
      headers: {
        origin,
        cookie: rotatedCookie,
        'x-agentclinic-csrf': rotatedBody.csrfToken,
      },
    });
    expect(signOut.statusCode).toBe(204);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/auth/sign-out',
          headers: { origin, cookie: rotatedCookie },
        })
      ).statusCode,
    ).toBe(204);
  });

  it('enforces roles, CSRF, trusted origin, session-derived identity, and non-revealing ownership', async () => {
    const anonymousStaff = await app.inject({
      method: 'GET',
      url: '/staff/appointments',
    });
    expect(anonymousStaff.statusCode, anonymousStaff.body).toBe(401);
    const agentLogin = await signIn(agentEmail);
    const agentCookie = cookiesFrom(agentLogin);
    const agentCsrf = agentLogin.json<{ csrfToken: string }>().csrfToken;
    expect(
      (
        await app.inject({
          method: 'GET',
          url: '/staff/appointments',
          headers: { cookie: agentCookie },
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: 'GET',
          url: '/agent/appointments/upcoming',
          headers: { cookie: agentCookie },
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await app.inject({
          method: 'GET',
          url: `/agents/${otherAgentId}/appointments/upcoming`,
          headers: { cookie: agentCookie },
        })
      ).statusCode,
    ).toBe(404);
    const otherSlotId = randomUUID();
    const otherAppointmentId = randomUUID();
    await prisma.availabilitySlot.create({
      data: {
        id: otherSlotId,
        therapyId: '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41',
        startsAt: new Date('2035-06-10T12:00:00Z'),
        durationMinutes: 45,
        isAvailable: true,
      },
    });
    await prisma.appointment.create({
      data: {
        id: otherAppointmentId,
        availabilitySlotId: otherSlotId,
        agentId: otherAgentId,
        visitorName: 'Private fixture',
        visitorEmail: 'private-fixture@example.test',
        status: 'CONFIRMED',
        idempotencyKey: randomUUID(),
        createdAt: now,
      },
    });
    expect(
      (
        await app.inject({
          method: 'POST',
          url: `/agent/appointments/${otherAppointmentId}/cancel`,
          headers: {
            cookie: agentCookie,
            origin,
            'x-agentclinic-csrf': agentCsrf,
          },
        })
      ).statusCode,
    ).toBe(404);
    const unknown = randomUUID();
    expect(
      (
        await app.inject({
          method: 'POST',
          url: `/agent/appointments/${unknown}/cancel`,
          headers: {
            cookie: agentCookie,
            origin,
            'x-agentclinic-csrf': agentCsrf,
          },
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: `/agent/appointments/${unknown}/cancel`,
          headers: { cookie: agentCookie, origin },
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: `/agent/appointments/${unknown}/cancel`,
          headers: {
            cookie: agentCookie,
            origin: 'https://untrusted.example',
            'x-agentclinic-csrf': agentCsrf,
          },
        })
      ).statusCode,
    ).toBe(403);

    await prisma.authSession.deleteMany();
    const staffLogin = await signIn(staffEmail);
    expect(
      (
        await app.inject({
          method: 'GET',
          url: '/agent/appointments/upcoming',
          headers: { cookie: cookiesFrom(staffLogin) },
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: 'GET',
          url: '/staff/appointments',
          headers: { cookie: cookiesFrom(staffLogin) },
        })
      ).statusCode,
    ).toBe(200);
  });

  it('expires at the exact boundary and throttles after five failures', async () => {
    const login = await signIn(agentEmail);
    const cookie = cookiesFrom(login);
    const stored = await prisma.authSession.findFirstOrThrow();
    clockNow = new Date(stored.expiresAt);
    expect(
      (
        await app.inject({
          method: 'GET',
          url: '/auth/session',
          headers: { cookie },
        })
      ).statusCode,
    ).toBe(401);
    const target = `throttle-${randomUUID()}@example.test`;
    for (let attempt = 0; attempt < 5; attempt += 1)
      expect(
        (await signIn(target, randomBytes(32).toString('hex'))).statusCode,
      ).toBe(401);
    expect(
      (await signIn(target, randomBytes(32).toString('hex'))).statusCode,
    ).toBe(429);
  });
});
