import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { NotFoundException } from '@nestjs/common';
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
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TherapiesService } from '../src/therapies/therapies.service';

const execute = promisify(execFile);
const serverRoot = resolve(__dirname, '..');
const contextSwitchingFatigueId = '16c0b8e2-7a4d-4f91-8c35-2d6e9a1b7f40';
const tokenTensionId = '7c16a4e8-3d0f-4c57-b091-8d2e5a7f3b06';
const contextGardenWalkId = '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41';
const quietCacheResetId = '7c3f9a56-8b20-4d74-a418-2f5c6e9a3d07';
const unknownId = '9e38c6a0-5f2d-4b79-a913-0d7e5c1b3a42';

const contextGardenWalk = {
  id: contextGardenWalkId,
  name: 'Context Garden Walk',
  summary: 'A gentle guided pause.',
  description: 'A calm sequence of reflection prompts.',
};

describe('TherapiesService', () => {
  const findMany = vi.fn();
  const findUnique = vi.fn();
  const prisma = { therapy: { findMany, findUnique } };
  let service: TherapiesService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new TherapiesService(prisma as unknown as PrismaService);
  });

  it('lists approved fields in deterministic order', async () => {
    findMany.mockResolvedValue([contextGardenWalk]);

    await expect(service.findAll()).resolves.toEqual([contextGardenWalk]);
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

  it('returns an empty list when no Therapies exist', async () => {
    findMany.mockResolvedValue([]);

    await expect(service.findAll()).resolves.toEqual([]);
  });

  it('returns ordered associated Ailments or maps a missing Therapy to not found', async () => {
    findUnique
      .mockResolvedValueOnce({
        ...contextGardenWalk,
        ailments: [
          { id: contextSwitchingFatigueId, name: 'Context Switching Fatigue' },
        ],
      })
      .mockResolvedValueOnce(null);

    await expect(service.findOne(contextGardenWalkId)).resolves.toMatchObject({
      ...contextGardenWalk,
      ailments: [
        { id: contextSwitchingFatigueId, name: 'Context Switching Fatigue' },
      ],
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: contextGardenWalkId },
      select: {
        id: true,
        name: true,
        summary: true,
        description: true,
        ailments: {
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          select: { id: true, name: true },
        },
      },
    });
    await expect(service.findOne(unknownId)).rejects.toThrow(NotFoundException);
  });

  it('does not hide persistence failures from Nest error handling', async () => {
    findMany.mockRejectedValue(new Error('database details'));
    await expect(service.findAll()).rejects.toThrow('database details');
  });
});

describe('Therapy API', () => {
  let app: NestFastifyApplication;
  let temporaryDirectory: string;
  let previousDatabaseUrl: string | undefined;

  beforeAll(async () => {
    temporaryDirectory = await mkdtemp(
      join(tmpdir(), 'agentclinic-therapies-'),
    );
    previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = `file:${join(temporaryDirectory, 'therapies.db')}`;
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

  it('returns the complete ordered Therapy list contract', async () => {
    const response = await app.inject({ method: 'GET', url: '/therapies' });
    const body = response.json<Array<Record<string, unknown>>>();

    expect(response.statusCode, response.body).toBe(200);
    expect(body.map(({ name }) => name)).toEqual([
      'Context Garden Walk',
      'Evidence Tea Ceremony',
      'Prompt Sorting Session',
      'Quiet Cache Reset',
    ]);
    expect(Object.keys(body[0]).sort()).toEqual([
      'description',
      'id',
      'name',
      'summary',
    ]);
  });

  it('returns valid detail with ordered minimal Ailments', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/therapies/${contextGardenWalkId}`,
    });
    const body = response.json<Record<string, unknown>>();

    expect(response.statusCode, response.body).toBe(200);
    expect(body).toMatchObject({
      id: contextGardenWalkId,
      name: 'Context Garden Walk',
    });
    expect(body.ailments).toEqual([
      { id: contextSwitchingFatigueId, name: 'Context Switching Fatigue' },
      { id: '5af4e2c6-1b8d-4a35-9e79-6b0c3e5f1d84', name: 'Prompt Overload' },
    ]);
  });

  it('supports a Therapy with no associated Ailments', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/therapies/${quietCacheResetId}`,
    });
    expect(response.statusCode, response.body).toBe(200);
    expect(response.json<{ ailments: unknown[] }>().ailments).toEqual([]);
  });

  it('returns safe malformed and unknown Therapy responses', async () => {
    const malformed = await app.inject({
      method: 'GET',
      url: '/therapies/not-a-uuid',
    });
    const unknown = await app.inject({
      method: 'GET',
      url: `/therapies/${unknownId}`,
    });

    expect(malformed.statusCode).toBe(400);
    expect(unknown.statusCode).toBe(404);
    expect(unknown.json()).toEqual({
      error: 'Not Found',
      message: 'Therapy not found',
      statusCode: 404,
    });
  });

  it('returns ordered associations and a successful empty association list', async () => {
    const multiple = await app.inject({
      method: 'GET',
      url: `/ailments/${contextSwitchingFatigueId}/therapies`,
    });
    const empty = await app.inject({
      method: 'GET',
      url: `/ailments/${tokenTensionId}/therapies`,
    });

    expect(multiple.statusCode, multiple.body).toBe(200);
    expect(
      multiple.json<Array<{ name: string }>>().map(({ name }) => name),
    ).toEqual(['Context Garden Walk', 'Prompt Sorting Session']);
    expect(empty.statusCode, empty.body).toBe(200);
    expect(empty.json()).toEqual([]);
  });

  it('returns safe malformed and unknown Ailment association responses', async () => {
    const malformed = await app.inject({
      method: 'GET',
      url: '/ailments/not-a-uuid/therapies',
    });
    const unknown = await app.inject({
      method: 'GET',
      url: `/ailments/${unknownId}/therapies`,
    });
    expect(malformed.statusCode).toBe(400);
    expect(unknown.statusCode).toBe(404);
  });

  it('does not expose internal failures in list, detail, or association responses', async () => {
    const listFailure = vi
      .spyOn(app.get(TherapiesService), 'findAll')
      .mockRejectedValueOnce(new Error('secret database path'));
    const list = await app.inject({ method: 'GET', url: '/therapies' });
    listFailure.mockRestore();
    const detailFailure = vi
      .spyOn(app.get(TherapiesService), 'findOne')
      .mockRejectedValueOnce(new Error('secret database path'));
    const detail = await app.inject({
      method: 'GET',
      url: `/therapies/${contextGardenWalkId}`,
    });
    detailFailure.mockRestore();
    const associationFailure = vi
      .spyOn(app.get(AilmentsService), 'findTherapies')
      .mockRejectedValueOnce(new Error('secret database path'));
    const association = await app.inject({
      method: 'GET',
      url: `/ailments/${contextSwitchingFatigueId}/therapies`,
    });
    associationFailure.mockRestore();

    for (const response of [list, detail, association]) {
      expect(response.statusCode).toBe(500);
      expect(response.body).not.toContain('secret database path');
    }
  });

  it('registers no Therapy or association mutation endpoints', async () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'] as const) {
      expect((await app.inject({ method, url: '/therapies' })).statusCode).toBe(
        404,
      );
      expect(
        (
          await app.inject({
            method,
            url: `/ailments/${contextSwitchingFatigueId}/therapies`,
          })
        ).statusCode,
      ).toBe(404);
    }
  });
});
