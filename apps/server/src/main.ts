import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 8 * 1024 }),
  );
  app.enableCors({
    origin: process.env.AGENTCLINIC_WEB_ORIGIN?.split(',') ?? [
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3200',
    ],
  });
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
