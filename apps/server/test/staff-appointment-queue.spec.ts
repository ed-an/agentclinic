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
import { PrismaService } from '../src/database/prisma.service';
import { installAuthenticatedInject } from './authenticated-inject';

const execute = promisify(execFile);
const serverRoot = resolve(__dirname, '..');
const now = new Date('2035-06-01T12:00:00.000Z');
const agentId = '0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40';
const otherAgentId = '2c6e8a10-3b45-4d79-a013-5f7b9d1e2a61';
const therapyId = '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41';
const otherTherapyId = '3f9b5c12-4d86-4e30-a074-8c1f2a5d9e63';
let app: NestFastifyApplication;
let prisma: PrismaService;
let directory: string;
let previousUrl: string | undefined;

async function fixture(
  id: string,
  startsAt: string,
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' = 'PENDING',
  owner = agentId,
  therapy = therapyId,
) {
  const slotId = crypto.randomUUID();
  await prisma.availabilitySlot.create({
    data: {
      id: slotId,
      therapyId: therapy,
      startsAt: new Date(startsAt),
      durationMinutes: 45,
      isAvailable: true,
    },
  });
  return prisma.appointment.create({
    data: {
      id,
      availabilitySlotId: slotId,
      agentId: owner,
      visitorName: 'Queue Private Visitor',
      visitorEmail: 'queue-private@example.test',
      status,
      cancelledAt:
        status === 'CANCELLED' ? new Date('2035-05-01T00:00:00Z') : null,
      cancellationSource: status === 'CANCELLED' ? 'AGENT' : null,
      idempotencyKey: crypto.randomUUID(),
      createdAt: new Date('2035-04-01T00:00:00Z'),
      statusEvents: {
        create: {
          id: crypto.randomUUID(),
          fromStatus: null,
          toStatus: status,
          actorType: 'SYSTEM',
          createdAt: new Date('2035-04-01T00:00:00Z'),
        },
      },
    },
  });
}

describe('Phase 9 staff appointment queue', () => {
  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'agentclinic-staff-queue-'));
    previousUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = `file:${join(directory, 'staff.db')}`;
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
    await installAuthenticatedInject(app, prisma, now);
  }, 30_000);

  beforeEach(async () => {
    await prisma.appointmentStatusEvent.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.availabilitySlot.deleteMany({
      where: {
        id: {
          notIn: [
            '8d4a1b68-9c32-4e86-b520-3a6d7f0c4e18',
            '9e5b2c70-ad43-4f98-8612-4b7e8a1d5f29',
            'af6c3d82-be54-40a1-9724-5c8f9b2e6a30',
            'b07d4e94-cf65-41b3-a836-6d9a0c3f7b41',
            'c18e5fa6-d076-42c5-b948-7e0b1d4a8c52',
            'd29f60b8-e187-43d7-8a50-8f1c2e5b9d63',
          ],
        },
      },
    });
  });

  afterAll(async () => {
    await app.close();
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
    await rm(directory, { recursive: true, force: true });
  });

  it('returns default queue, combined filters, cancelled records, deterministic order, and safe fields', async () => {
    await fixture(
      'e0000000-0000-4000-8000-000000000002',
      '2035-06-03T12:00:00Z',
    );
    await fixture(
      'e0000000-0000-4000-8000-000000000001',
      '2035-06-02T12:00:00Z',
      'CONFIRMED',
    );
    await fixture(
      'e0000000-0000-4000-8000-000000000003',
      '2035-05-01T12:00:00Z',
    );
    await fixture(
      'e0000000-0000-4000-8000-000000000004',
      '2035-06-04T12:00:00Z',
      'CANCELLED',
      otherAgentId,
      otherTherapyId,
    );
    const response = await app.inject({
      method: 'GET',
      url: '/staff/appointments',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json<Array<{ id: string }>>().map(({ id }) => id)).toEqual([
      'e0000000-0000-4000-8000-000000000001',
      'e0000000-0000-4000-8000-000000000002',
    ]);
    expect(response.body).not.toContain('Queue Private Visitor');
    expect(response.body).not.toContain('queue-private@example.test');
    expect(response.body).not.toContain('idempotencyKey');
    const safeBody = response.json<Array<Record<string, unknown>>>();
    expect(Object.keys(safeBody[0]).sort()).toEqual([
      'agent',
      'cancellationAllowed',
      'confirmationAllowed',
      'createdAt',
      'displayTimeZone',
      'durationMinutes',
      'endsAt',
      'id',
      'lastStatusChangedAt',
      'startsAt',
      'status',
      'therapy',
    ]);
    const combined = await app.inject({
      method: 'GET',
      url: `/staff/appointments?status=PENDING,CONFIRMED&agentId=${agentId}&therapyId=${therapyId}&from=2035-06-02T12%3A00%3A00Z&to=2035-06-03T12%3A00%3A00Z`,
    });
    expect(combined.json<Array<{ id: string }>>().map(({ id }) => id)).toEqual([
      'e0000000-0000-4000-8000-000000000001',
    ]);
    const cancelled = await app.inject({
      method: 'GET',
      url: '/staff/appointments?status=CANCELLED',
    });
    expect(cancelled.json<Array<{ id: string }>>().map(({ id }) => id)).toEqual(
      ['e0000000-0000-4000-8000-000000000004'],
    );
    expect(
      (
        await app.inject({
          method: 'GET',
          url: `/staff/appointments?agentId=${crypto.randomUUID()}`,
        })
      ).json(),
    ).toEqual([]);
  });

  it.each([
    'unknown=true',
    'status=UNKNOWN',
    'status=PENDING&status=PENDING',
    'agentId=nope',
    'therapyId=nope',
    'from=2035-06-01',
    'from=2035-06-02T00%3A00%3A00Z&to=2035-06-01T00%3A00%3A00Z',
    'from=2035-01-01T00%3A00%3A00Z&to=2035-04-02T00%3A00%3A00Z',
  ])('rejects malformed queue query safely: %s', async (query) => {
    const response = await app.inject({
      method: 'GET',
      url: `/staff/appointments?${query}`,
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).not.toContain('Prisma');
    expect(response.body).not.toContain('queue-private@example.test');
  });

  it('confirms once under replay and concurrency and reveals the Agent dashboard item', async () => {
    const appointment = await fixture(
      crypto.randomUUID(),
      '2035-06-03T12:00:00Z',
    );
    const url = `/staff/appointments/${appointment.id}/confirm`;
    const [left, right] = await Promise.all([
      app.inject({ method: 'POST', url }),
      app.inject({ method: 'POST', url }),
    ]);
    expect([left.statusCode, right.statusCode]).toEqual([200, 200]);
    expect((await app.inject({ method: 'POST', url })).statusCode).toBe(200);
    const stored = await prisma.appointment.findUniqueOrThrow({
      where: { id: appointment.id },
    });
    expect(stored.status).toBe('CONFIRMED');
    expect(
      await prisma.appointmentStatusEvent.count({
        where: {
          appointmentId: appointment.id,
          fromStatus: 'PENDING',
          toStatus: 'CONFIRMED',
        },
      }),
    ).toBe(1);
    const dashboard = await app.inject({
      method: 'GET',
      url: `/agents/${agentId}/appointments/upcoming`,
    });
    expect(dashboard.body).toContain(appointment.id);
  });

  it('rejects ineligible confirmations and rolls back status plus event on failure', async () => {
    const cancelled = await fixture(
      crypto.randomUUID(),
      '2035-06-03T12:00:00Z',
      'CANCELLED',
    );
    const past = await fixture(crypto.randomUUID(), '2035-05-03T12:00:00Z');
    const confirmedPast = await fixture(
      crypto.randomUUID(),
      '2035-05-04T12:00:00Z',
      'CONFIRMED',
    );
    expect(
      (
        await app.inject({
          method: 'POST',
          url: `/staff/appointments/${cancelled.id}/confirm`,
        })
      ).statusCode,
    ).toBe(409);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: `/staff/appointments/${past.id}/confirm`,
        })
      ).statusCode,
    ).toBe(409);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: `/staff/appointments/${confirmedPast.id}/confirm`,
        })
      ).statusCode,
    ).toBe(409);
    const failing = await fixture(crypto.randomUUID(), '2035-06-04T12:00:00Z');
    await prisma.$executeRawUnsafe(
      `CREATE TRIGGER phase9_confirm_failure BEFORE INSERT ON AppointmentStatusEvent WHEN NEW.appointmentId='${failing.id}' BEGIN SELECT RAISE(ABORT, 'failure'); END`,
    );
    const response = await app.inject({
      method: 'POST',
      url: `/staff/appointments/${failing.id}/confirm`,
    });
    await prisma.$executeRawUnsafe('DROP TRIGGER phase9_confirm_failure');
    expect(response.statusCode).toBe(500);
    expect(
      (
        await prisma.appointment.findUniqueOrThrow({
          where: { id: failing.id },
        })
      ).status,
    ).toBe('PENDING');
    expect(
      await prisma.appointmentStatusEvent.count({
        where: { appointmentId: failing.id, fromStatus: 'PENDING' },
      }),
    ).toBe(0);
  });

  it('cancels pending and confirmed inside Agent cutoff with controlled reasons and restores availability', async () => {
    const pending = await fixture(crypto.randomUUID(), '2035-06-01T13:00:00Z');
    const confirmed = await fixture(
      crypto.randomUUID(),
      '2035-06-01T13:30:00Z',
      'CONFIRMED',
    );
    for (const appointment of [pending, confirmed]) {
      const url = `/staff/appointments/${appointment.id}/cancel`;
      const payload = { reasonCode: 'SCHEDULE_CHANGE' };
      const [left, right] = await Promise.all([
        app.inject({ method: 'POST', url, payload }),
        app.inject({ method: 'POST', url, payload }),
      ]);
      expect([left.statusCode, right.statusCode]).toEqual([200, 200]);
      const stored = await prisma.appointment.findUniqueOrThrow({
        where: { id: appointment.id },
      });
      expect(stored).toMatchObject({
        status: 'CANCELLED',
        cancellationSource: 'STAFF',
        cancellationReasonCode: 'SCHEDULE_CHANGE',
      });
      expect(
        await prisma.appointmentStatusEvent.count({
          where: {
            appointmentId: appointment.id,
            toStatus: 'CANCELLED',
            actorType: 'STAFF',
          },
        }),
      ).toBe(1);
      expect(
        (await app.inject({ method: 'POST', url, payload })).json(),
      ).toEqual(left.json());
      const availability = await app.inject({
        method: 'GET',
        url: `/therapies/${therapyId}/availability`,
      });
      expect(availability.body).toContain(appointment.availabilitySlotId);
    }
  });

  it('validates cancellation reason, start boundary, and transaction rollback', async () => {
    const atStart = await fixture(crypto.randomUUID(), now.toISOString());
    for (const payload of [
      {},
      { reasonCode: 'FREE_TEXT' },
      { reasonCode: 'SCHEDULE_CHANGE', note: 'private' },
    ]) {
      expect(
        (
          await app.inject({
            method: 'POST',
            url: `/staff/appointments/${atStart.id}/cancel`,
            payload,
          })
        ).statusCode,
      ).toBe(400);
    }
    expect(
      (
        await app.inject({
          method: 'POST',
          url: `/staff/appointments/${atStart.id}/cancel`,
          payload: { reasonCode: 'STAFF_UNAVAILABLE' },
        })
      ).statusCode,
    ).toBe(409);
    const failing = await fixture(
      crypto.randomUUID(),
      '2035-06-04T12:00:00Z',
      'CONFIRMED',
    );
    await prisma.$executeRawUnsafe(
      `CREATE TRIGGER phase9_cancel_failure BEFORE INSERT ON AppointmentStatusEvent WHEN NEW.appointmentId='${failing.id}' BEGIN SELECT RAISE(ABORT, 'failure'); END`,
    );
    const response = await app.inject({
      method: 'POST',
      url: `/staff/appointments/${failing.id}/cancel`,
      payload: { reasonCode: 'STAFF_UNAVAILABLE' },
    });
    await prisma.$executeRawUnsafe('DROP TRIGGER phase9_cancel_failure');
    expect(response.statusCode).toBe(500);
    expect(
      await prisma.appointment.findUniqueOrThrow({ where: { id: failing.id } }),
    ).toMatchObject({ status: 'CONFIRMED', cancelledAt: null });
    expect(
      await prisma.appointmentStatusEvent.count({
        where: { appointmentId: failing.id, toStatus: 'CANCELLED' },
      }),
    ).toBe(0);
  });

  it('creates one pending booking event and blocks availability without leaking personal data', async () => {
    const key = crypto.randomUUID();
    const slotId = '8d4a1b68-9c32-4e86-b520-3a6d7f0c4e18';
    const payload = {
      availabilitySlotId: slotId,
      agentId,
      visitorName: 'Hidden Visitor',
      visitorEmail: 'hidden@example.test',
    };
    const first = await app.inject({
      method: 'POST',
      url: '/appointments',
      headers: { 'idempotency-key': key },
      payload,
    });
    const replay = await app.inject({
      method: 'POST',
      url: '/appointments',
      headers: { 'idempotency-key': key },
      payload,
    });
    expect([first.statusCode, replay.statusCode]).toEqual([201, 200]);
    expect(first.json()).toMatchObject({ status: 'PENDING' });
    const id = first.json<{ id: string }>().id;
    expect(
      await prisma.appointmentStatusEvent.count({
        where: {
          appointmentId: id,
          fromStatus: null,
          toStatus: 'PENDING',
          actorType: 'VISITOR',
        },
      }),
    ).toBe(1);
    expect(
      (
        await app.inject({
          method: 'GET',
          url: `/therapies/${therapyId}/availability`,
        })
      ).body,
    ).not.toContain(slotId);
    const queue = await app.inject({
      method: 'GET',
      url: '/staff/appointments',
    });
    expect(queue.body).not.toContain('Hidden Visitor');
    expect(queue.body).not.toContain('hidden@example.test');
  });

  it('converges confirm racing with cancel without duplicate transition events', async () => {
    const appointment = await fixture(
      crypto.randomUUID(),
      '2035-06-04T12:00:00Z',
    );
    const [confirmation, cancellation] = await Promise.all([
      app.inject({
        method: 'POST',
        url: `/staff/appointments/${appointment.id}/confirm`,
      }),
      app.inject({
        method: 'POST',
        url: `/staff/appointments/${appointment.id}/cancel`,
        payload: { reasonCode: 'DUPLICATE_BOOKING' },
      }),
    ]);
    expect([200, 409]).toContain(confirmation.statusCode);
    expect(cancellation.statusCode).toBe(200);
    expect(
      (
        await prisma.appointment.findUniqueOrThrow({
          where: { id: appointment.id },
        })
      ).status,
    ).toBe('CANCELLED');
    const events = await prisma.appointmentStatusEvent.findMany({
      where: { appointmentId: appointment.id, fromStatus: { not: null } },
    });
    expect(
      events.filter(({ toStatus }) => toStatus === 'CONFIRMED'),
    ).toHaveLength(confirmation.statusCode === 200 ? 1 : 0);
    expect(
      events.filter(({ toStatus }) => toStatus === 'CANCELLED'),
    ).toHaveLength(1);
  });

  it('keeps active uniqueness when booking races with slot-restoring cancellation', async () => {
    const appointment = await fixture(
      crypto.randomUUID(),
      '2035-06-05T12:00:00Z',
      'CONFIRMED',
    );
    const bookingPayload = {
      availabilitySlotId: appointment.availabilitySlotId,
      agentId,
      visitorName: 'Race Private Visitor',
      visitorEmail: 'race-private@example.test',
    };
    const [cancellation, booking] = await Promise.all([
      app.inject({
        method: 'POST',
        url: `/staff/appointments/${appointment.id}/cancel`,
        payload: { reasonCode: 'SCHEDULE_CHANGE' },
      }),
      app.inject({
        method: 'POST',
        url: '/appointments',
        headers: { 'idempotency-key': crypto.randomUUID() },
        payload: bookingPayload,
      }),
    ]);
    expect(cancellation.statusCode).toBe(200);
    expect([201, 409]).toContain(booking.statusCode);
    expect(
      await prisma.appointment.count({
        where: {
          availabilitySlotId: appointment.availabilitySlotId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }),
    ).toBe(booking.statusCode === 201 ? 1 : 0);
    const transitionEvents = await prisma.appointmentStatusEvent.findMany({
      where: { appointmentId: appointment.id, fromStatus: { not: null } },
    });
    expect(transitionEvents).toHaveLength(1);
    expect(transitionEvents[0]).toMatchObject({
      fromStatus: 'CONFIRMED',
      toStatus: 'CANCELLED',
      actorType: 'STAFF',
    });
  });
});
