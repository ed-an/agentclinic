import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AgentAppointmentsController } from './agent-appointments.controller';
import { CancellationPolicyService } from './cancellation-policy.service';

@Module({
  imports: [AvailabilityModule],
  controllers: [AppointmentsController, AgentAppointmentsController],
  providers: [AppointmentsService, CancellationPolicyService],
})
export class AppointmentsModule {}
