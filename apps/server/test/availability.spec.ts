import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AvailabilityService } from '../src/availability/availability.service';
import { CurrentTimeService } from '../src/availability/current-time.service';
import {
  AVAILABILITY_MAX_RANGE_DAYS,
  AvailabilityQueryPipe,
} from '../src/availability/pipes/availability-query.pipe';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

const execute = promisify(execFile);
const serverRoot = resolve(__dirname, '..');
const contextGardenWalkId = '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41';
const evidenceTeaId = '3f9b5c12-4d86-4e30-a074-8c1f2a5d9e63';
const quietCacheResetId = '7c3f9a56-8b20-4d74-a418-2f5c6e9a3d07';
const unknownId = '9e38c6a0-5f2d-4b79-a913-0d7e5c1b3a42';
const fixedNow = new Date('2035-06-01T12:00:00.000Z');

describe('AvailabilityQueryPipe', () => {
  const pipe = new AvailabilityQueryPipe();

  it('accepts absent and strict timestamp boundaries', () => {
    expect(pipe.transform({})).toEqual({});
    expect(
      pipe.transform({
        from: '2035-06-01T12:00:00Z',
        to: '2035-06-02T12:00:00+00:00',
      }),
    ).toEqual({
      from: new Date('2035-06-01T12:00:00Z'),
      to: new Date('2035-06-02T12:00:00Z'),
    });
  });

  it.each([
    { from: '2035-06-01' },
    { from: '2035-06-01T12:00:00' },
    { from: '2035-02-30T12:00:00Z' },
    { from: ['2035-06-01T12:00:00Z', '2035-06-02T12:00:00Z'] },
    { includeUnavailable: 'true' },
  ])('rejects malformed, repeated, or unsupported input: %j', (query) => {
    expect(() => pipe.transform(query)).toThrow(BadRequestException);
  });

  it('requires an increasing range no longer than 90 days', () => {
    const from = '2035-01-01T00:00:00Z';
    const boundary = new Date(
      new Date(from).getTime() + AVAILABILITY_MAX_RANGE_DAYS * 86_400_000,
    ).toISOString();
    expect(() => pipe.transform({ from, to: from })).toThrow(
      BadRequestException,
    );
    expect(() =>
      pipe.transform({ from: '2035-01-02T00:00:00Z', to: from }),
    ).toThrow(BadRequestException);
    expect(pipe.transform({ from, to: boundary }).to).toEqual(
      new Date(boundary),
    );
    expect(() =>
      pipe.transform({
        from,
        to: new Date(new Date(boundary).getTime() + 1).toISOString(),
      }),
    ).toThrow(BadRequestException);
  });
});

describe('AvailabilityService', () => {
  const therapyFindUnique = vi.fn();
  const slotFindMany = vi.fn();
  const prisma = {
    therapy: { findUnique: therapyFindUnique },
    availabilitySlot: { findMany: slotFindMany },
  };
  const clock = { now: vi.fn(() => fixedNow) };
  let service: AvailabilityService;

  beforeEach(() => {
    vi.resetAllMocks();
    clock.now.mockReturnValue(fixedNow);
    therapyFindUnique.mockResolvedValue({ id: contextGardenWalkId });
    slotFindMany.mockResolvedValue([]);
    service = new AvailabilityService(
      prisma as unknown as PrismaService,
      clock,
    );
  });

  it('uses the controlled clock and excludes unavailable slots', async () => {
    await expect(
      service.findForTherapy(contextGardenWalkId, {}),
    ).resolves.toEqual([]);
    expect(slotFindMany).toHaveBeenCalledWith({
      where: {
        therapyId: contextGardenWalkId,
        isAvailable: true,
        appointments: { none: { status: { in: ['PENDING', 'CONFIRMED'] } } },
        startsAt: { gte: fixedNow },
      },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        therapyId: true,
        startsAt: true,
        durationMinutes: true,
      },
    });
  });

  it('applies inclusive from and exclusive to and derives UTC end times', async () => {
    const startsAt = new Date('2035-06-15T02:30:00.000Z');
    const from = new Date(startsAt);
    const to = new Date('2035-06-16T00:00:00.000Z');
    slotFindMany.mockResolvedValue([
      {
        id: '8d4a1b68-9c32-4e86-b520-3a6d7f0c4e18',
        therapyId: contextGardenWalkId,
        startsAt,
        durationMinutes: 45,
      },
    ]);

    await expect(
      service.findForTherapy(contextGardenWalkId, { from, to }),
    ).resolves.toEqual([
      {
        id: '8d4a1b68-9c32-4e86-b520-3a6d7f0c4e18',
        therapyId: contextGardenWalkId,
        startsAt: '2035-06-15T02:30:00.000Z',
        durationMinutes: 45,
        endsAt: '2035-06-15T03:15:00.000Z',
      },
    ]);
    expect(slotFindMany).toHaveBeenCalledWith({
      where: {
        therapyId: contextGardenWalkId,
        isAvailable: true,
        appointments: { none: { status: { in: ['PENDING', 'CONFIRMED'] } } },
        startsAt: { gte: from, lt: to },
      },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        therapyId: true,
        startsAt: true,
        durationMinutes: true,
      },
    });
  });

  it('maps an unknown Therapy to not found before querying slots', async () => {
    therapyFindUnique.mockResolvedValue(null);
    await expect(service.findForTherapy(unknownId, {})).rejects.toThrow(
      NotFoundException,
    );
    expect(slotFindMany).not.toHaveBeenCalled();
  });
});

describe('Availability API', () => {
  let app: NestFastifyApplication;
  let temporaryDirectory: string;
  let previousDatabaseUrl: string | undefined;

  beforeAll(async () => {
    temporaryDirectory = await mkdtemp(
      join(tmpdir(), 'agentclinic-availability-'),
    );
    previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = `file:${join(temporaryDirectory, 'availability.db')}`;
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
  });

  afterAll(async () => {
    await app.close();
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it('returns upcoming available slots in deterministic order', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/therapies/${contextGardenWalkId}/availability`,
    });
    const body = response.json<Array<Record<string, unknown>>>();

    expect(response.statusCode, response.body).toBe(200);
    expect(body.map(({ startsAt }) => startsAt)).toEqual([
      '2035-06-15T02:30:00.000Z',
      '2035-06-15T03:30:00.000Z',
    ]);
    expect(Object.keys(body[0]).sort()).toEqual([
      'durationMinutes',
      'endsAt',
      'id',
      'startsAt',
      'therapyId',
    ]);
  });

  it('returns empty results for no slots and only past or unavailable slots', async () => {
    const noSlots = await app.inject({
      method: 'GET',
      url: `/therapies/${quietCacheResetId}/availability`,
    });
    const noCurrentAvailability = await app.inject({
      method: 'GET',
      url: `/therapies/${evidenceTeaId}/availability`,
    });
    expect(noSlots.statusCode).toBe(200);
    expect(noSlots.json()).toEqual([]);
    expect(noCurrentAvailability.statusCode).toBe(200);
    expect(noCurrentAvailability.json()).toEqual([]);
  });

  it('uses inclusive from and exclusive to boundaries', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/therapies/${contextGardenWalkId}/availability?from=2035-06-15T02%3A30%3A00Z&to=2035-06-15T03%3A30%3A00Z`,
    });
    expect(response.statusCode, response.body).toBe(200);
    expect(
      response
        .json<Array<{ startsAt: string }>>()
        .map(({ startsAt }) => startsAt),
    ).toEqual(['2035-06-15T02:30:00.000Z']);
  });

  it('supports either range boundary and can explicitly request a past slot', async () => {
    const fromOnly = await app.inject({
      method: 'GET',
      url: `/therapies/${contextGardenWalkId}/availability?from=2035-06-15T03%3A30%3A00Z`,
    });
    const toOnly = await app.inject({
      method: 'GET',
      url: `/therapies/${contextGardenWalkId}/availability?to=2035-06-15T03%3A30%3A00Z`,
    });
    const explicitPast = await app.inject({
      method: 'GET',
      url: `/therapies/${evidenceTeaId}/availability?from=2035-05-01T00%3A00%3A00Z&to=2035-06-01T00%3A00%3A00Z`,
    });

    expect(
      fromOnly
        .json<Array<{ startsAt: string }>>()
        .map(({ startsAt }) => startsAt),
    ).toEqual(['2035-06-15T03:30:00.000Z']);
    expect(
      toOnly
        .json<Array<{ startsAt: string }>>()
        .map(({ startsAt }) => startsAt),
    ).toEqual(['2035-06-15T02:30:00.000Z']);
    expect(
      explicitPast
        .json<Array<{ startsAt: string }>>()
        .map(({ startsAt }) => startsAt),
    ).toEqual(['2035-05-20T15:00:00.000Z']);
  });

  it.each([
    'from=2035-06-01',
    'from=2035-06-01T12%3A00%3A00',
    'from=2035-06-01T12%3A00%3A00Z&from=2035-06-02T12%3A00%3A00Z',
    'from=2035-06-02T12%3A00%3A00Z&to=2035-06-02T12%3A00%3A00Z',
    'from=2035-06-03T12%3A00%3A00Z&to=2035-06-02T12%3A00%3A00Z',
    'from=2035-01-01T00%3A00%3A00Z&to=2035-04-02T00%3A00%3A00Z',
    'includeUnavailable=true',
  ])('returns safe 400 for invalid query: %s', async (query) => {
    const response = await app.inject({
      method: 'GET',
      url: `/therapies/${contextGardenWalkId}/availability?${query}`,
    });
    expect(response.statusCode, response.body).toBe(400);
    expect(response.body).not.toContain('stack');
  });

  it('returns safe malformed and unknown Therapy responses', async () => {
    const malformed = await app.inject({
      method: 'GET',
      url: '/therapies/not-a-uuid/availability',
    });
    const unknown = await app.inject({
      method: 'GET',
      url: `/therapies/${unknownId}/availability`,
    });
    expect(malformed.statusCode).toBe(400);
    expect(unknown.statusCode).toBe(404);
  });

  it('does not expose unexpected internal failures', async () => {
    const failure = vi
      .spyOn(app.get(AvailabilityService), 'findForTherapy')
      .mockRejectedValueOnce(new Error('secret database path'));
    const response = await app.inject({
      method: 'GET',
      url: `/therapies/${contextGardenWalkId}/availability`,
    });
    failure.mockRestore();
    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain('secret database path');
  });

  it('registers no availability mutations or later Appointment mutations', async () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'] as const) {
      expect(
        (
          await app.inject({
            method,
            url: `/therapies/${contextGardenWalkId}/availability`,
          })
        ).statusCode,
      ).toBe(404);
      if (method !== 'POST')
        expect(
          (await app.inject({ method, url: '/appointments' })).statusCode,
        ).toBe(404);
    }
  });
});
