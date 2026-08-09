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
import { AppointmentsService } from './appointments.service';
import { AgentAppointmentResponseDto } from './dto/appointment-response.dto';
import { RequireRole } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth-request';

@Controller('agents/:agentId/appointments')
@RequireRole('AGENT')
export class AgentAppointmentsController {
  constructor(
    @Inject(AppointmentsService)
    private readonly appointments: AppointmentsService,
  ) {}

  @Get('upcoming')
  findUpcoming(
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<AgentAppointmentResponseDto[]> {
    return this.appointments.findUpcoming(
      this.requireMatchingAgent(request, agentId),
    );
  }

  @Post(':appointmentId/cancel')
  @HttpCode(200)
  cancel(
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
    @Param('appointmentId', new ParseUUIDPipe({ version: '4' }))
    appointmentId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<AgentAppointmentResponseDto> {
    return this.appointments.cancel(
      this.requireMatchingAgent(request, agentId),
      appointmentId,
    );
  }

  private requireMatchingAgent(
    request: AuthenticatedRequest,
    routeAgentId: string,
  ): string {
    if (!request.auth?.agentId || request.auth.agentId !== routeAgentId)
      throw new NotFoundException('Appointment not found');
    return request.auth.agentId;
  }
}
