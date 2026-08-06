import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';

describe('GET /health', () => {
  let app: NestFastifyApplication | undefined;
  let databaseDirectory: string;
  let previousDatabaseUrl: string | undefined;

  beforeEach(async () => {
    previousDatabaseUrl = process.env.DATABASE_URL;
    databaseDirectory = await mkdtemp(join(tmpdir(), 'agentclinic-health-'));
    process.env.DATABASE_URL = `file:${join(databaseDirectory, 'health.db')}`;
  });

  afterEach(async () => {
    await app?.close();
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
    await rm(databaseDirectory, { recursive: true, force: true });
  });

  it('reports that the service is healthy', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
