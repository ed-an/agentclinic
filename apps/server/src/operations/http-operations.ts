import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { OperationalConfig } from './operational-config';
import { effectiveRequestId, writeLog } from './structured-logger';

export const SERVER_CSP =
  "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

export function configureOperationalHttp(
  app: NestFastifyApplication,
  config: OperationalConfig,
): void {
  const startedAt = new WeakMap<object, bigint>();
  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook('onRequest', (request, reply, done) => {
    const incoming = request.headers['x-request-id'];
    const id = effectiveRequestId(
      Array.isArray(incoming) ? undefined : incoming,
    );
    request.id = id;
    startedAt.set(request, process.hrtime.bigint());
    reply.header('x-request-id', id);
    done();
  });
  fastify.addHook('onSend', (_request, reply, _payload, done) => {
    reply.header('content-security-policy', SERVER_CSP);
    reply.header('x-content-type-options', 'nosniff');
    reply.header('referrer-policy', 'no-referrer');
    reply.header(
      'permissions-policy',
      'camera=(), microphone=(), geolocation=()',
    );
    reply.header('x-frame-options', 'DENY');
    reply.removeHeader('x-powered-by');
    if (config.environment === 'production' && config.https)
      reply.header(
        'strict-transport-security',
        'max-age=31536000; includeSubDomains',
      );
    done();
  });
  fastify.addHook('onResponse', (request, reply, done) => {
    const start = startedAt.get(request) ?? process.hrtime.bigint();
    writeLog({
      severity:
        reply.statusCode >= 500
          ? 'error'
          : reply.statusCode >= 400
            ? 'warn'
            : 'info',
      event: 'http.request.completed',
      service: config.serviceName,
      environment: config.environment,
      requestId: request.id,
      method: request.method,
      route: request.routeOptions.url ?? 'unmatched',
      status: reply.statusCode,
      durationMs: Number(process.hrtime.bigint() - start) / 1_000_000,
    });
    done();
  });
}
