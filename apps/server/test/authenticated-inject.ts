import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { InjectOptions, Response } from 'light-my-request';
import type { PrismaService } from '../src/database/prisma.service';

const origin = 'http://127.0.0.1:3200';
const agentIds = [
  '0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40',
  '2c6e8a10-3b45-4d79-a013-5f7b9d1e2a61',
  '4e8a1c32-5d67-4f90-b124-7a9c1e3f4b82',
];

function hash(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

export async function installAuthenticatedInject(
  app: NestFastifyApplication,
  prisma: PrismaService,
  now: Date,
): Promise<void> {
  const sessions = new Map<string, { cookie: string; csrf: string }>();
  for (const [index, agentId] of agentIds.entries()) {
    const key = `agent:${agentId}`;
    sessions.set(
      key,
      await createSession(prisma, now, 'AGENT', agentId, index),
    );
  }
  sessions.set('staff', await createSession(prisma, now, 'STAFF', null, 9));
  const instance = app.getHttpAdapter().getInstance();
  const original = instance.inject.bind(instance) as (
    options: string | InjectOptions,
  ) => Promise<Response>;
  instance.inject = ((options: string | InjectOptions) => {
    if (typeof options === 'string') return original(options);
    const url =
      typeof options.url === 'string'
        ? options.url
        : (options.url?.pathname ?? '');
    const match = url.match(/^\/agents\/([^/]+)\/appointments/);
    const credentials = url.startsWith('/staff/')
      ? sessions.get('staff')
      : match
        ? (sessions.get(`agent:${match[1]}`) ??
          sessions.get(`agent:${agentIds[0]}`))
        : undefined;
    if (!credentials) return original(options);
    return original({
      ...options,
      headers: {
        ...options.headers,
        cookie: `agentclinic_session=${credentials.cookie}`,
        ...(options.method && options.method !== 'GET'
          ? { origin, 'x-agentclinic-csrf': credentials.csrf }
          : {}),
      },
    });
  }) as typeof instance.inject;
}

async function createSession(
  prisma: PrismaService,
  now: Date,
  role: 'AGENT' | 'STAFF',
  agentId: string | null,
  suffix: number,
): Promise<{ cookie: string; csrf: string }> {
  const accountId = randomUUID();
  await prisma.userAccount.create({
    data: {
      id: accountId,
      email: `${role.toLowerCase()}-${suffix}@regression.example.test`,
      passwordHash: 'regression-fixture-only',
      role,
      agentId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });
  const cookie = randomBytes(32).toString('base64url');
  const csrf = randomBytes(32).toString('base64url');
  await prisma.authSession.create({
    data: {
      id: randomUUID(),
      accountId,
      tokenHash: hash(cookie),
      csrfTokenHash: hash(csrf),
      createdAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
  });
  return { cookie, csrf };
}
