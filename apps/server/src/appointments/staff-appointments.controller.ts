import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import {
  StaffAppointmentQueryDto,
  StaffAppointmentResponseDto,
  StaffCancellationDto,
} from './dto/staff-appointment.dto';
import { StaffAppointmentQueryPipe } from './pipes/staff-appointment-query.pipe';
import { StaffCancellationPipe } from './pipes/staff-cancellation.pipe';
import { RequireRole } from '../auth/auth.guard';

@Controller('staff/appointments')
@RequireRole('STAFF')
export class StaffAppointmentsController {
  constructor(
    @Inject(AppointmentsService)
    private readonly appointments: AppointmentsService,
  ) {}

  @Get()
  findQueue(
    @Query(StaffAppointmentQueryPipe) query: StaffAppointmentQueryDto,
  ): Promise<StaffAppointmentResponseDto[]> {
    return this.appointments.findStaffQueue(query);
  }

  @Post(':appointmentId/confirm')
  @HttpCode(200)
  confirm(
    @Param('appointmentId', new ParseUUIDPipe({ version: '4' }))
    appointmentId: string,
  ): Promise<StaffAppointmentResponseDto> {
    return this.appointments.confirmStaff(appointmentId);
  }

  @Post(':appointmentId/cancel')
  @HttpCode(200)
  cancel(
    @Param('appointmentId', new ParseUUIDPipe({ version: '4' }))
    appointmentId: string,
    @Body(StaffCancellationPipe) input: StaffCancellationDto,
  ): Promise<StaffAppointmentResponseDto> {
    return this.appointments.cancelStaff(appointmentId, input.reasonCode);
  }
}
