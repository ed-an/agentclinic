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
import { AilmentsService } from '../src/ailments/ailments.service';
import {
  AILMENT_SEARCH_MAX_LENGTH,
  AilmentSearchQueryPipe,
} from '../src/ailments/pipes/ailment-search-query.pipe';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

const execute = promisify(execFile);
const serverRoot = resolve(__dirname, '..');

const contextSwitchingFatigue = {
  id: '16c0b8e2-7a4d-4f91-8c35-2d6e9a1b7f40',
  name: 'Context Switching Fatigue',
  summary: 'Mental drag after moving rapidly between unrelated tasks.',
  description: 'Calm transitions can help restore a steady rhythm.',
};

type AilmentContract = Readonly<{
  id: string;
  name: string;
  summary: string;
  description: string;
}>;

describe('AilmentSearchQueryPipe', () => {
  const pipe = new AilmentSearchQueryPipe();

  it('normalizes absent, empty, whitespace-only, and surrounded input', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
    expect(pipe.transform('')).toBeUndefined();
    expect(pipe.transform('   ')).toBeUndefined();
    expect(pipe.transform('  fatigue  ')).toBe('fatigue');
  });

  it('accepts the documented 100-code-point boundary', () => {
    const query = '🤖'.repeat(AILMENT_SEARCH_MAX_LENGTH);
    expect(pipe.transform(query)).toBe(query);
  });

  it('rejects excessive or non-scalar input safely', () => {
    expect(() =>
      pipe.transform('a'.repeat(AILMENT_SEARCH_MAX_LENGTH + 1)),
    ).toThrow(BadRequestException);
    expect(() => pipe.transform(['fatigue', 'tension'])).toThrow(
      BadRequestException,
    );
  });
});

describe('AilmentsService', () => {
  const findMany = vi.fn();
  const findUnique = vi.fn();
  const prisma = { ailment: { findMany, findUnique } };
  let service: AilmentsService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new AilmentsService(prisma as unknown as PrismaService);
  });

  it('lists only approved fields in deterministic order', async () => {
    findMany.mockResolvedValue([contextSwitchingFatigue]);

    await expect(service.findAll()).resolves.toEqual([contextSwitchingFatigue]);
    expect(findMany).toHaveBeenCalledWith({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        summary: true,
        description: true,
      },
    });
  });

  it('uses parameterized name and summary filters for search', async () => {
    findMany.mockResolvedValue([]);

    await expect(service.findAll('fatigue')).resolves.toEqual([]);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: 'fatigue' } },
          { summary: { contains: 'fatigue' } },
        ],
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        summary: true,
        description: true,
      },
    });
  });

  it('returns one ailment or maps a missing ailment to not found', async () => {
    findUnique
      .mockResolvedValueOnce(contextSwitchingFatigue)
      .mockResolvedValueOnce(null);

    await expect(service.findOne(contextSwitchingFatigue.id)).resolves.toEqual(
      contextSwitchingFatigue,
    );
    await expect(service.findOne(contextSwitchingFatigue.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('does not hide persistence failures from Nest error handling', async () => {
    findMany.mockRejectedValue(new Error('database details'));
    await expect(service.findAll()).rejects.toThrow('database details');
  });
});

describe('Ailment API', () => {
  let app: NestFastifyApplication;
  let temporaryDirectory: string;
  let previousDatabaseUrl: string | undefined;

  beforeAll(async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), 'agentclinic-ailments-'));
    previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = `file:${join(temporaryDirectory, 'ailments.db')}`;
    await execute('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: serverRoot,
      env: process.env,
    });
    await execute('npx', ['prisma', 'db', 'seed'], {
      cwd: serverRoot,
      env: process.env,
    });
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
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

  it('returns the complete ordered list contract', async () => {
    const response = await app.inject({ method: 'GET', url: '/ailments' });
    const body = response.json<AilmentContract[]>();

    expect(response.statusCode, response.body).toBe(200);
    expect(body.map(({ name }) => name)).toEqual([
      'Context Switching Fatigue',
      'Hallucination Anxiety',
      'Prompt Overload',
      'Token Tension',
    ]);
    expect(Object.keys(body[0]).sort()).toEqual([
      'description',
      'id',
      'name',
      'summary',
    ]);
  });

  it.each([
    ['/ailments?q=FATIGUE', 'Context Switching Fatigue'],
    ['/ailments?q=confident', 'Hallucination Anxiety'],
    ['/ailments?q=%20%20overload%20%20', 'Prompt Overload'],
  ])('searches name and summary case-insensitively: %s', async (url, name) => {
    const response = await app.inject({ method: 'GET', url });

    expect(response.statusCode, response.body).toBe(200);
    expect(response.json<AilmentContract[]>().map((item) => item.name)).toEqual(
      [name],
    );
  });

  it.each(['/ailments', '/ailments?q=', '/ailments?q=%20%20%20'])(
    'treats an absent or blank query as the complete list: %s',
    async (url) => {
      const response = await app.inject({ method: 'GET', url });
      expect(response.statusCode, response.body).toBe(200);
      expect(response.json<AilmentContract[]>()).toHaveLength(4);
    },
  );

  it('returns an empty list for a valid search without matches', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/ailments?q=does-not-exist',
    });

    expect(response.statusCode, response.body).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it('accepts the query limit and safely rejects excessive or repeated input', async () => {
    const boundary = await app.inject({
      method: 'GET',
      url: `/ailments?q=${'a'.repeat(AILMENT_SEARCH_MAX_LENGTH)}`,
    });
    const excessive = await app.inject({
      method: 'GET',
      url: `/ailments?q=${'a'.repeat(AILMENT_SEARCH_MAX_LENGTH + 1)}`,
    });
    const repeated = await app.inject({
      method: 'GET',
      url: '/ailments?q=fatigue&q=tension',
    });

    expect(boundary.statusCode).toBe(200);
    expect(excessive.statusCode).toBe(400);
    expect(excessive.body).not.toContain('stack');
    expect(repeated.statusCode).toBe(400);
  });

  it('treats SQL metacharacters as search data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/ailments?q=${encodeURIComponent("%' OR 1=1 --")}`,
    });

    expect(response.statusCode, response.body).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it('returns valid detail and safe malformed and unknown responses', async () => {
    const valid = await app.inject({
      method: 'GET',
      url: `/ailments/${contextSwitchingFatigue.id}`,
    });
    const malformed = await app.inject({
      method: 'GET',
      url: '/ailments/not-a-uuid',
    });
    const unknown = await app.inject({
      method: 'GET',
      url: '/ailments/9e38c6a0-5f2d-4b79-a913-0d7e5c1b3a42',
    });

    expect(valid.statusCode, valid.body).toBe(200);
    expect(valid.json()).toMatchObject({
      id: contextSwitchingFatigue.id,
      name: contextSwitchingFatigue.name,
    });
    expect(malformed.statusCode).toBe(400);
    expect(unknown.statusCode).toBe(404);
    expect(unknown.json()).toEqual({
      error: 'Not Found',
      message: 'Ailment not found',
      statusCode: 404,
    });
  });

  it('does not expose internal failures in 500 responses', async () => {
    const listFailure = vi
      .spyOn(app.get(AilmentsService), 'findAll')
      .mockRejectedValueOnce(new Error('secret database path'));
    const listResponse = await app.inject({ method: 'GET', url: '/ailments' });
    listFailure.mockRestore();

    const detailFailure = vi
      .spyOn(app.get(AilmentsService), 'findOne')
      .mockRejectedValueOnce(new Error('secret database path'));
    const detailResponse = await app.inject({
      method: 'GET',
      url: `/ailments/${contextSwitchingFatigue.id}`,
    });
    detailFailure.mockRestore();

    for (const response of [listResponse, detailResponse]) {
      expect(response.statusCode).toBe(500);
      expect(response.body).not.toContain('secret database path');
    }
  });

  it('registers no Ailment mutation endpoints', async () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'] as const) {
      const response = await app.inject({ method, url: '/ailments' });
      expect(response.statusCode).toBe(404);
    }
  });
});
