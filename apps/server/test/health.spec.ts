import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { ReadinessService } from '../src/operations/readiness.service';
import {
  configureOperationalHttp,
  SERVER_CSP,
} from '../src/operations/http-operations';
import { loadOperationalConfig } from '../src/operations/operational-config';

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
    configureOperationalHttp(
      app,
      loadOperationalConfig({
        NODE_ENV: 'test',
        DATABASE_URL: process.env.DATABASE_URL,
      }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    expect(response.headers['x-request-id']).toMatch(/^[A-Za-z0-9._-]+$/);
    expect(response.headers['content-security-policy']).toBe(SERVER_CSP);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['strict-transport-security']).toBeUndefined();

    const correlated = await Promise.all(
      ['correlation-one', 'correlation-two'].map((requestId) =>
        app!.inject({
          method: 'GET',
          url: '/health/live',
          headers: { 'x-request-id': requestId },
        }),
      ),
    );
    expect(correlated.map(({ headers }) => headers['x-request-id'])).toEqual([
      'correlation-one',
      'correlation-two',
    ]);
  });

  it('separates liveness from safe readiness and applies operational headers', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const live = await app.inject({
      method: 'GET',
      url: '/health/live',
      headers: { 'x-request-id': 'accepted-id' },
    });
    expect(live.statusCode).toBe(200);

    const readiness = app.get(ReadinessService);
    const readinessCheck = vi
      .spyOn(readiness, 'isReady')
      .mockResolvedValue(false);
    const unavailable = await app.inject({
      method: 'GET',
      url: '/health/ready',
    });
    expect(unavailable.statusCode, unavailable.body).toBe(503);
    expect(unavailable.json()).toEqual({ status: 'unavailable' });

    readinessCheck.mockResolvedValue(true);
    const ready = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(ready.statusCode).toBe(200);
    expect(ready.json()).toEqual({ status: 'ok' });
  });
});
