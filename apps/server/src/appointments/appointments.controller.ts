import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { AppointmentsService } from './appointments.service';
import {
  AppointmentResponseDto,
  BookingContextResponseDto,
} from './dto/appointment-response.dto';
import {
  CreateAppointmentDto,
  CreateAppointmentPipe,
  parseIdempotencyKey,
} from './dto/create-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(
    @Inject(AppointmentsService)
    private readonly appointments: AppointmentsService,
  ) {}

  @Get('booking-context/:slotId')
  getBookingContext(
    @Param('slotId', new ParseUUIDPipe({ version: '4' })) slotId: string,
  ): Promise<BookingContextResponseDto> {
    return this.appointments.getBookingContext(slotId);
  }

  @Post()
  @HttpCode(201)
  async create(
    @Body(CreateAppointmentPipe) input: CreateAppointmentDto,
    @Headers('idempotency-key') header: string | string[] | undefined,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AppointmentResponseDto> {
    const result = await this.appointments.create(
      input,
      parseIdempotencyKey(header),
    );
    reply.status(result.created ? 201 : 200);
    return result.appointment;
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<AppointmentResponseDto> {
    return this.appointments.findOne(id);
  }
}
