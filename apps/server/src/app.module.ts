import { Module } from '@nestjs/common';
import { AgentsModule } from './agents/agents.module';
import { AilmentsModule } from './ailments/ailments.module';
import { PrismaModule } from './database/prisma.module';
import { HealthController } from './health.controller';
import { TherapiesModule } from './therapies/therapies.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { OperationsModule } from './operations/operations.module';

@Module({
  imports: [
    PrismaModule,
    AgentsModule,
    AilmentsModule,
    TherapiesModule,
    AppointmentsModule,
    AuthModule,
    OperationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
