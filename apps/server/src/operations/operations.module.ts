import { Module } from '@nestjs/common';
import { ReadinessService } from './readiness.service';

@Module({ providers: [ReadinessService], exports: [ReadinessService] })
export class OperationsModule {}
