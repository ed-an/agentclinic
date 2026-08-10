import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { loadOperationalConfig } from './operations/operational-config';
import { ReadinessService } from './operations/readiness.service';
import { writeLog } from './operations/structured-logger';
import { SafeExceptionFilter } from './operations/safe-exception.filter';
import { configureOperationalHttp } from './operations/http-operations';

async function bootstrap(): Promise<void> {
  const config = loadOperationalConfig();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 8 * 1024,
      trustProxy: config.trustProxy,
    }),
    { logger: config.environment === 'production' ? false : undefined },
  );
  configureOperationalHttp(app, config);
  app.enableCors({
    origin: config.trustedOrigins,
    credentials: true,
  });
  app.useGlobalFilters(new SafeExceptionFilter(config));
  await app.listen(config.port, '0.0.0.0');
  writeLog({
    severity: 'info',
    event: 'lifecycle.started',
    service: config.serviceName,
    environment: config.environment,
  });

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.get(ReadinessService).beginShutdown();
    writeLog({
      severity: 'info',
      event: 'lifecycle.shutdown.started',
      service: config.serviceName,
      environment: config.environment,
    });
    const timeout = setTimeout(() => {
      writeLog({
        severity: 'error',
        event: 'lifecycle.shutdown.timeout',
        service: config.serviceName,
        environment: config.environment,
        errorCode: 'SHUTDOWN_TIMEOUT',
      });
      process.exit(1);
    }, config.shutdownTimeoutMs);
    timeout.unref();
    await app.close();
    clearTimeout(timeout);
    writeLog({
      severity: 'info',
      event: 'lifecycle.shutdown.completed',
      service: config.serviceName,
      environment: config.environment,
    });
    process.exit(signal === 'SIGINT' ? 130 : 0);
  };
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
}

void bootstrap().catch((error: unknown) => {
  const code =
    error instanceof Error && /^[A-Z0-9_]+$/.test(error.message)
      ? error.message
      : 'STARTUP_FAILED';
  writeLog({
    severity: 'error',
    event: 'lifecycle.startup.failed',
    service: 'agentclinic-server',
    environment: process.env.NODE_ENV ?? 'development',
    errorCode: code,
  });
  process.exitCode = 1;
});
