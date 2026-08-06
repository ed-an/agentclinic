import { Module } from '@nestjs/common';
import { AgentsModule } from './agents/agents.module';
import { AilmentsModule } from './ailments/ailments.module';
import { PrismaModule } from './database/prisma.module';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule, AgentsModule, AilmentsModule],
  controllers: [HealthController],
})
export class AppModule {}
