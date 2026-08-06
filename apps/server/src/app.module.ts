import { Module } from '@nestjs/common';
import { AgentsModule } from './agents/agents.module';
import { PrismaModule } from './database/prisma.module';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule, AgentsModule],
  controllers: [HealthController],
})
export class AppModule {}
