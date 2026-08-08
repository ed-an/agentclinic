import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { CurrentTimeService } from '../src/availability/current-time.service';
import { PrismaService } from '../src/database/prisma.service';

const execute = promisify(execFile);
const serverRoot = resolve(__dirname, '..');
const therapyId = '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41';
const slotId = '8d4a1b68-9c32-4e86-b520-3a6d7f0c4e18';
const secondSlotId = '9e5b2c70-ad43-4f98-8612-4b7e8a1d5f29';
const fixedNow = new Date('2035-06-01T12:00:00.000Z');
let agentId: string;
let app: NestFastifyApplication;
let directory: string;
let previousUrl: string | undefined;

function payload(availabilitySlotId = slotId) {
  return {
    availabilitySlotId,
    agentId,
    visitorName: '  Ada Visitor  ',
    visitorEmail: ' ADA@Example.COM ',
  };
}

describe('Appointments API', () => {
  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'agentclinic-appointments-'));
    previousUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = `file:${join(directory, 'appointments.db')}`;
    await execute('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: serverRoot,
      env: process.env,
    });
    await execute('npx', ['prisma', 'db', 'seed'], {
      cwd: serverRoot,
      env: process.env,
    });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CurrentTimeService)
      .useValue({ now: () => fixedNow })
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    agentId = (
      await app
        .get(PrismaService)
        .agent.findFirstOrThrow({ orderBy: { id: 'asc' } })
    ).id;
  });
  afterAll(async () => {
    await app.close();
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
    await rm(directory, { recursive: true, force: true });
  });

  it('returns authoritative booking context', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/appointments/booking-context/${slotId}`,
    });
    expect(response.statusCode, response.body).toBe(200);
    expect(response.json()).toMatchObject({
      slotId,
      therapy: { id: therapyId },
      startsAt: '2035-06-15T02:30:00.000Z',
      displayTimeZone: 'America/Sao_Paulo',
    });
  });

  it('validates strict input and does not consume rejected keys', async () => {
    const key = crypto.randomUUID();
    const bad = await app.inject({
      method: 'POST',
      url: '/appointments',
      headers: { 'idempotency-key': key },
      payload: { ...payload(), therapyId },
    });
    expect(bad.statusCode).toBe(400);
    expect(
      await app
        .get(PrismaService)
        .appointment.count({ where: { idempotencyKey: key } }),
    ).toBe(0);
  });

  it('creates a private confirmation, filters availability, and replays idempotently', async () => {
    const key = crypto.randomUUID();
    const first = await app.inject({
      method: 'POST',
      url: '/appointments',
      headers: { 'idempotency-key': key },
      payload: payload(),
    });
    expect(first.statusCode, first.body).toBe(201);
    const body = first.json<Record<string, unknown>>();
    expect(JSON.stringify(body)).not.toContain('ada@example.com');
    expect(Object.keys(body).sort()).toEqual([
      'agent',
      'createdAt',
      'displayTimeZone',
      'durationMinutes',
      'endsAt',
      'id',
      'startsAt',
      'status',
      'therapy',
    ]);
    const stored = await app.get(PrismaService).appointment.findUniqueOrThrow({
      where: { idempotencyKey: key },
      include: { availabilitySlot: true },
    });
    expect(stored.visitorName).toBe('Ada Visitor');
    expect(stored.visitorEmail).toBe('ada@example.com');
    expect(stored.availabilitySlot.isAvailable).toBe(true);
    const replay = await app.inject({
      method: 'POST',
      url: '/appointments',
      headers: { 'idempotency-key': key },
      payload: {
        ...payload(),
        visitorName: 'Ada Visitor',
        visitorEmail: 'ada@example.com',
      },
    });
    expect(replay.statusCode).toBe(200);
    expect(replay.json()).toEqual(body);
    const availability = await app.inject({
      method: 'GET',
      url: `/therapies/${therapyId}/availability`,
    });
    expect(
      availability.json<Array<{ id: string }>>().map(({ id }) => id),
    ).not.toContain(slotId);
    const confirmation = await app.inject({
      method: 'GET',
      url: `/appointments/${body.id as string}`,
    });
    expect(confirmation.statusCode).toBe(200);
    expect(confirmation.json()).toEqual(body);
  });

  it('rejects repurposed keys and occupied slots safely', async () => {
    const originalKey = (
      await app.get(PrismaService).appointment.findFirstOrThrow()
    ).idempotencyKey;
    const repurposed = await app.inject({
      method: 'POST',
      url: '/appointments',
      headers: { 'idempotency-key': originalKey },
      payload: payload(secondSlotId),
    });
    expect(repurposed.statusCode).toBe(409);
    expect(repurposed.body).not.toContain('Prisma');
    const occupied = await app.inject({
      method: 'POST',
      url: '/appointments',
      headers: { 'idempotency-key': crypto.randomUUID() },
      payload: payload(),
    });
    expect(occupied.statusCode).toBe(409);
  });

  it('uses the database uniqueness safeguard under real concurrent requests', async () => {
    const [left, right] = await Promise.all([
      app.inject({
        method: 'POST',
        url: '/appointments',
        headers: { 'idempotency-key': crypto.randomUUID() },
        payload: payload(secondSlotId),
      }),
      app.inject({
        method: 'POST',
        url: '/appointments',
        headers: { 'idempotency-key': crypto.randomUUID() },
        payload: payload(secondSlotId),
      }),
    ]);
    expect([left.statusCode, right.statusCode].sort()).toEqual([201, 409]);
    expect(
      await app
        .get(PrismaService)
        .appointment.count({ where: { availabilitySlotId: secondSlotId } }),
    ).toBe(1);

    const retrySlotId = crypto.randomUUID();
    await app.get(PrismaService).availabilitySlot.create({
      data: {
        id: retrySlotId,
        therapyId,
        startsAt: new Date('2035-08-01T12:00:00.000Z'),
        durationMinutes: 45,
        isAvailable: true,
      },
    });
    const retryKey = crypto.randomUUID();
    const [firstRetry, secondRetry] = await Promise.all([
      app.inject({
        method: 'POST',
        url: '/appointments',
        headers: { 'idempotency-key': retryKey },
        payload: payload(retrySlotId),
      }),
      app.inject({
        method: 'POST',
        url: '/appointments',
        headers: { 'idempotency-key': retryKey },
        payload: payload(retrySlotId),
      }),
    ]);
    expect([firstRetry.statusCode, secondRetry.statusCode].sort()).toEqual([
      200, 201,
    ]);
    expect(firstRetry.json()).toEqual(secondRetry.json());
    expect(
      await app
        .get(PrismaService)
        .appointment.count({ where: { idempotencyKey: retryKey } }),
    ).toBe(1);
  });

  it('returns safe malformed and unknown resource responses', async () => {
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/appointments',
          payload: payload(),
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (await app.inject({ method: 'GET', url: '/appointments/not-a-uuid' }))
        .statusCode,
    ).toBe(400);
    expect(
      (
        await app.inject({
          method: 'GET',
          url: `/appointments/${crypto.randomUUID()}`,
        })
      ).statusCode,
    ).toBe(404);
  });
});
