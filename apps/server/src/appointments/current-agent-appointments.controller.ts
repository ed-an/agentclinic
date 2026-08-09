import {
  Controller,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { RequireRole } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth-request';
import { AppointmentsService } from './appointments.service';
import { AgentAppointmentResponseDto } from './dto/appointment-response.dto';

@Controller('agent/appointments')
@RequireRole('AGENT')
export class CurrentAgentAppointmentsController {
  constructor(
    @Inject(AppointmentsService)
    private readonly appointments: AppointmentsService,
  ) {}

  @Get('upcoming')
  findUpcoming(
    @Req() request: AuthenticatedRequest,
  ): Promise<AgentAppointmentResponseDto[]> {
    return this.appointments.findUpcoming(this.agentId(request));
  }

  @Post(':appointmentId/cancel')
  @HttpCode(200)
  cancel(
    @Req() request: AuthenticatedRequest,
    @Param('appointmentId', new ParseUUIDPipe({ version: '4' }))
    appointmentId: string,
  ): Promise<AgentAppointmentResponseDto> {
    return this.appointments.cancel(this.agentId(request), appointmentId);
  }

  private agentId(request: AuthenticatedRequest): string {
    if (!request.auth?.agentId)
      throw new NotFoundException('Appointment not found');
    return request.auth.agentId;
  }
}
