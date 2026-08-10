import { Controller, Get, Inject, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ReadinessService } from './operations/readiness.service';

export interface HealthResponse {
  status: 'ok';
}

@Controller('health')
export class HealthController {
  constructor(
    @Inject(ReadinessService) private readonly readiness: ReadinessService,
  ) {}

  @Get('live')
  live(): HealthResponse {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready(
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<HealthResponse | { status: 'unavailable' }> {
    if (await this.readiness.isReady()) {
      return { status: 'ok' };
    }
    reply.code(503);
    return { status: 'unavailable' };
  }

  @Get()
  legacy(): HealthResponse {
    return { status: 'ok' };
  }
}
