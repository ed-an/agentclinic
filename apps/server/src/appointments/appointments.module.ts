import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AgentAppointmentsController } from './agent-appointments.controller';
import { CancellationPolicyService } from './cancellation-policy.service';
import { StaffAppointmentsController } from './staff-appointments.controller';
import { AuthModule } from '../auth/auth.module';
import { CurrentAgentAppointmentsController } from './current-agent-appointments.controller';

@Module({
  imports: [AvailabilityModule, AuthModule],
  controllers: [
    AppointmentsController,
    AgentAppointmentsController,
    StaffAppointmentsController,
    CurrentAgentAppointmentsController,
  ],
  providers: [AppointmentsService, CancellationPolicyService],
})
export class AppointmentsModule {}
