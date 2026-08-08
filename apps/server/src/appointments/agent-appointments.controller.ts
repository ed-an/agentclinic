import {
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AgentAppointmentResponseDto } from './dto/appointment-response.dto';

@Controller('agents/:agentId/appointments')
export class AgentAppointmentsController {
  constructor(
    @Inject(AppointmentsService)
    private readonly appointments: AppointmentsService,
  ) {}

  @Get('upcoming')
  findUpcoming(
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
  ): Promise<AgentAppointmentResponseDto[]> {
    return this.appointments.findUpcoming(agentId);
  }

  @Post(':appointmentId/cancel')
  @HttpCode(200)
  cancel(
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
    @Param('appointmentId', new ParseUUIDPipe({ version: '4' }))
    appointmentId: string,
  ): Promise<AgentAppointmentResponseDto> {
    return this.appointments.cancel(agentId, appointmentId);
  }
}
