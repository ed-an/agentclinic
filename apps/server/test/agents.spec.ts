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
import { AgentsService } from '../src/agents/agents.service';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

const execute = promisify(execFile);
const serverRoot = resolve(__dirname, '..');

const ada = {
  id: '0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40',
  name: 'Ada',
  model: 'Reasoning assistant',
  summary: 'A thoughtful problem-solver.',
};

type AgentContract = Readonly<{
  id: string;
  model: string;
  name: string;
  summary: string;
}>;

describe('AgentsService', () => {
  const findMany = vi.fn();
  const findUnique = vi.fn();
  const prisma = { agent: { findMany, findUnique } };
  let service: AgentsService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new AgentsService(prisma as unknown as PrismaService);
  });

  it('lists only approved fields in deterministic order', async () => {
    findMany.mockResolvedValue([ada]);

    await expect(service.findAll()).resolves.toEqual([ada]);
    expect(findMany).toHaveBeenCalledWith({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true, model: true, summary: true },
    });
  });

  it('returns an empty list when no agents exist', async () => {
    findMany.mockResolvedValue([]);

    await expect(service.findAll()).resolves.toEqual([]);
  });

  it('returns one agent by its stable identifier', async () => {
    findUnique.mockResolvedValue(ada);

    await expect(service.findOne(ada.id)).resolves.toEqual(ada);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: ada.id },
      select: { id: true, name: true, model: true, summary: true },
    });
  });

  it('maps a missing agent to not found', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.findOne(ada.id)).rejects.toThrow(NotFoundException);
  });

  it('does not hide persistence failures', async () => {
    findMany.mockRejectedValue(new Error('database details'));

    await expect(service.findAll()).rejects.toThrow('database details');
  });
});

describe('Agent API', () => {
  let app: NestFastifyApplication;
  let temporaryDirectory: string;
  let previousDatabaseUrl: string | undefined;

  beforeAll(async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), 'agentclinic-agents-'));
    previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = `file:${join(temporaryDirectory, 'agents.db')}`;
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
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it('returns the Agent list contract', async () => {
    await expect(app.get(AgentsService).findAll()).resolves.toHaveLength(3);
    const response = await app.inject({ method: 'GET', url: '/agents' });
    const body = JSON.parse(response.body) as AgentContract[];

    expect(response.statusCode, response.body).toBe(200);
    expect(body).toHaveLength(3);
    expect(body.map((agent) => agent.name)).toEqual([
      'Ada',
      'Juniper',
      'Patch',
    ]);
    expect(Object.keys(body[0]).sort()).toEqual([
      'id',
      'model',
      'name',
      'summary',
    ]);
  });

  it('returns the Agent detail contract', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/agents/${ada.id}`,
    });

    expect(response.statusCode, response.body).toBe(200);
    expect(response.json()).toMatchObject({
      id: ada.id,
      name: ada.name,
      model: ada.model,
    });
  });

  it('rejects an invalid identifier before querying', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/agents/not-a-uuid',
    });

    expect(response.statusCode).toBe(400);
  });

  it('returns a safe not-found response', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/agents/8f0e2d4c-6b8a-4c12-9345-7d9e1f3a5b60',
    });

    expect(response.statusCode, response.body).toBe(404);
    expect(response.json()).toEqual({
      error: 'Not Found',
      message: 'Agent not found',
      statusCode: 404,
    });
  });

  it('does not expose an internal failure in the response', async () => {
    const failure = vi
      .spyOn(app.get(AgentsService), 'findAll')
      .mockRejectedValueOnce(new Error('database details'));

    const response = await app.inject({ method: 'GET', url: '/agents' });

    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain('database details');
    failure.mockRestore();
  });
});
