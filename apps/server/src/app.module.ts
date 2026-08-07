import { Module } from '@nestjs/common';
import { AgentsModule } from './agents/agents.module';
import { AilmentsModule } from './ailments/ailments.module';
import { PrismaModule } from './database/prisma.module';
import { HealthController } from './health.controller';
import { TherapiesModule } from './therapies/therapies.module';

@Module({
  imports: [PrismaModule, AgentsModule, AilmentsModule, TherapiesModule],
  controllers: [HealthController],
})
export class AppModule {}
