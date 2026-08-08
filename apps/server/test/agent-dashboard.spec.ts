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
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { CurrentTimeService } from '../src/availability/current-time.service';
import { parseCancellationCutoffHours } from '../src/appointments/cancellation-policy.service';
import { PrismaService } from '../src/database/prisma.service';

const execute = promisify(execFile);
const serverRoot = resolve(__dirname, '..');
const now = new Date('2035-06-01T12:00:00.000Z');
const therapyId = '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41';
const agentId = '0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40';
const otherAgentId = '2c6e8a10-3b45-4d79-a013-5f7b9d1e2a61';
let app: NestFastifyApplication;
let prisma: PrismaService;
let directory: string;
let previousUrl: string | undefined;

function slotData(id: string, startsAt: string, isAvailable = true) {
  return {
    id,
    therapyId,
    startsAt: new Date(startsAt),
    durationMinutes: 45,
    isAvailable,
  };
}

async function createAppointment(
  id: string,
  slotId: string,
  owner = agentId,
  status = 'CONFIRMED',
  cancelledAt: Date | null = null,
) {
  return prisma.appointment.create({
    data: {
      id,
      availabilitySlotId: slotId,
      agentId: owner,
      visitorName: 'Private Visitor',
      visitorEmail: 'private@example.test',
      status,
      cancelledAt,
      idempotencyKey: crypto.randomUUID(),
      createdAt: new Date('2035-05-01T00:00:00.000Z'),
    },
  });
}

describe('Phase 8 Agent dashboard API', () => {
  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'agentclinic-dashboard-'));
    previousUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = `file:${join(directory, 'dashboard.db')}`;
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
      .useValue({ now: () => new Date(now) })
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.appointment.deleteMany();
    await prisma.availabilitySlot.deleteMany({
      where: { id: { startsWith: 'f0000000-' } },
    });
  });

  afterAll(async () => {
    await app.close();
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
    await rm(directory, { recursive: true, force: true });
  });

  it('validates the documented cancellation configuration', () => {
    expect(parseCancellationCutoffHours(undefined)).toBe(24);
    expect(parseCancellationCutoffHours('12.5')).toBe(12.5);
    for (const invalid of ['nope', '-1', 'Infinity', '8761'])
      expect(() => parseCancellationCutoffHours(invalid)).toThrow();
  });

  it('returns only ordered future confirmed appointments without private fields', async () => {
    const slots = [
      slotData('f0000000-0000-4000-8000-000000000001', '2035-06-04T12:00:00Z'),
      slotData('f0000000-0000-4000-8000-000000000002', '2035-06-03T12:00:00Z'),
      slotData('f0000000-0000-4000-8000-000000000003', '2035-05-31T12:00:00Z'),
      slotData('f0000000-0000-4000-8000-000000000004', '2035-06-05T12:00:00Z'),
      slotData('f0000000-0000-4000-8000-000000000005', '2035-06-06T12:00:00Z'),
    ];
    await prisma.availabilitySlot.createMany({ data: slots });
    await createAppointment(
      'e0000000-0000-4000-8000-000000000002',
      slots[0].id,
    );
    await createAppointment(
      'e0000000-0000-4000-8000-000000000001',
      slots[1].id,
    );
    await createAppointment(
      'e0000000-0000-4000-8000-000000000003',
      slots[2].id,
    );
    await createAppointment(
      'e0000000-0000-4000-8000-000000000004',
      slots[3].id,
      agentId,
      'CANCELLED',
      now,
    );
    await createAppointment(
      'e0000000-0000-4000-8000-000000000005',
      slots[4].id,
      otherAgentId,
    );
    const response = await app.inject({
      method: 'GET',
      url: `/agents/${agentId}/appointments/upcoming`,
    });
    expect(response.statusCode, response.body).toBe(200);
    expect(response.json<Array<{ id: string }>>().map(({ id }) => id)).toEqual([
      'e0000000-0000-4000-8000-000000000001',
      'e0000000-0000-4000-8000-000000000002',
    ]);
    expect(response.body).not.toContain('Private Visitor');
    expect(response.body).not.toContain('private@example.test');
    expect(response.body).not.toContain('idempotencyKey');
    expect(
      (
        await app.inject({
          method: 'GET',
          url: `/agents/${otherAgentId}/appointments/upcoming`,
        })
      ).statusCode,
    ).toBe(200);
  });

  it('returns safe malformed, unknown, and ownership-mismatch responses', async () => {
    const slot = slotData(
      'f0000000-0000-4000-8000-000000000006',
      '2035-06-10T12:00:00Z',
    );
    await prisma.availabilitySlot.create({ data: slot });
    const appointment = await createAppointment(
      'e0000000-0000-4000-8000-000000000006',
      slot.id,
    );
    expect(
      (
        await app.inject({
          method: 'GET',
          url: '/agents/not-a-uuid/appointments/upcoming',
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await app.inject({
          method: 'GET',
          url: `/agents/${crypto.randomUUID()}/appointments/upcoming`,
        })
      ).statusCode,
    ).toBe(404);
    const unknown = await app.inject({
      method: 'POST',
      url: `/agents/${agentId}/appointments/${crypto.randomUUID()}/cancel`,
    });
    const mismatch = await app.inject({
      method: 'POST',
      url: `/agents/${otherAgentId}/appointments/${appointment.id}/cancel`,
    });
    expect(unknown.statusCode).toBe(404);
    expect(mismatch.statusCode).toBe(404);
    expect(mismatch.json()).toEqual(unknown.json());
  });

  it.each([
    ['more than cutoff', '2035-06-02T13:00:00Z', 200],
    ['exact cutoff', '2035-06-02T12:00:00Z', 200],
    ['inside cutoff', '2035-06-02T11:59:59.999Z', 409],
    ['at start', '2035-06-01T12:00:00Z', 409],
    ['after start', '2035-06-01T11:59:59.999Z', 409],
  ])(
    'enforces the cancellation boundary: %s',
    async (_, startsAt, expected) => {
      const suffix = crypto.randomUUID();
      await prisma.availabilitySlot.create({
        data: slotData(suffix, startsAt),
      });
      const appointment = await createAppointment(crypto.randomUUID(), suffix);
      const response = await app.inject({
        method: 'POST',
        url: `/agents/${agentId}/appointments/${appointment.id}/cancel`,
      });
      expect(response.statusCode, response.body).toBe(expected);
    },
  );

  it('cancels once, replays with unchanged timestamp, restores and rebooks the slot', async () => {
    const slot = slotData(
      'f0000000-0000-4000-8000-000000000007',
      '2035-06-10T12:00:00Z',
    );
    await prisma.availabilitySlot.create({ data: slot });
    const appointment = await createAppointment(
      'e0000000-0000-4000-8000-000000000007',
      slot.id,
    );
    const url = `/agents/${agentId}/appointments/${appointment.id}/cancel`;
    const [left, right] = await Promise.all([
      app.inject({ method: 'POST', url }),
      app.inject({ method: 'POST', url }),
    ]);
    expect([left.statusCode, right.statusCode]).toEqual([200, 200]);
    expect(left.json()).toEqual(right.json());
    const cancelled = await prisma.appointment.findUniqueOrThrow({
      where: { id: appointment.id },
    });
    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.cancelledAt?.toISOString()).toBe(now.toISOString());
    const replay = await app.inject({ method: 'POST', url });
    expect(replay.statusCode).toBe(200);
    expect(
      (
        await prisma.appointment.findUniqueOrThrow({
          where: { id: appointment.id },
        })
      ).cancelledAt,
    ).toEqual(cancelled.cancelledAt);
    const availability = await app.inject({
      method: 'GET',
      url: `/therapies/${therapyId}/availability`,
    });
    expect(
      availability.json<Array<{ id: string }>>().map(({ id }) => id),
    ).toContain(slot.id);
    const rebookingPayload = {
      availabilitySlotId: slot.id,
      agentId,
      visitorName: 'New Private Visitor',
      visitorEmail: 'new-private@example.test',
    };
    const [booking, competingBooking] = await Promise.all([
      app.inject({
        method: 'POST',
        url: '/appointments',
        headers: { 'idempotency-key': crypto.randomUUID() },
        payload: rebookingPayload,
      }),
      app.inject({
        method: 'POST',
        url: '/appointments',
        headers: { 'idempotency-key': crypto.randomUUID() },
        payload: rebookingPayload,
      }),
    ]);
    expect([booking.statusCode, competingBooking.statusCode].sort()).toEqual([
      201, 409,
    ]);
    expect(
      await prisma.appointment.count({
        where: { availabilitySlotId: slot.id },
      }),
    ).toBe(2);
    expect(
      await prisma.appointment.count({
        where: { availabilitySlotId: slot.id, status: 'CONFIRMED' },
      }),
    ).toBe(1);
  });

  it('rolls back status and cancelledAt when persistence fails', async () => {
    const slot = slotData(
      'f0000000-0000-4000-8000-000000000008',
      '2035-06-10T12:00:00Z',
    );
    await prisma.availabilitySlot.create({ data: slot });
    const appointment = await createAppointment(
      'e0000000-0000-4000-8000-000000000008',
      slot.id,
    );
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER fail_phase8_cancellation
      BEFORE UPDATE OF status ON Appointment
      WHEN NEW.id = '${appointment.id}'
      BEGIN
        SELECT RAISE(ABORT, 'simulated cancellation failure');
      END;
    `);
    const response = await app.inject({
      method: 'POST',
      url: `/agents/${agentId}/appointments/${appointment.id}/cancel`,
    });
    await prisma.$executeRawUnsafe('DROP TRIGGER fail_phase8_cancellation');
    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain('simulated cancellation failure');
    expect(response.body).not.toContain('Prisma');
    const unchanged = await prisma.appointment.findUniqueOrThrow({
      where: { id: appointment.id },
    });
    expect(unchanged.status).toBe('CONFIRMED');
    expect(unchanged.cancelledAt).toBeNull();
  });
});
