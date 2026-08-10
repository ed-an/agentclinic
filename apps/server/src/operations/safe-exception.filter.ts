import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import type { ExceptionFilter } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { OperationalConfig } from './operational-config';
import { writeLog } from './structured-logger';

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  constructor(private readonly config: OperationalConfig) {}

  catch(error: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const reply = context.getResponse<FastifyReply>();
    const status = error instanceof HttpException ? error.getStatus() : 500;
    if (status < 500 && error instanceof HttpException) {
      void reply.status(status).send(error.getResponse());
      return;
    }
    writeLog({
      severity: 'error',
      event: 'http.request.failed',
      service: this.config.serviceName,
      environment: this.config.environment,
      requestId: request.id,
      errorCode: 'INTERNAL_ERROR',
    });
    void reply.status(500).send({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Unable to complete request',
      requestId: request.id,
    });
  }
}
