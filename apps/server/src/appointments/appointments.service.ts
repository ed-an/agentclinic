import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CurrentTimeService } from '../availability/current-time.service';
import { PrismaService } from '../database/prisma.service';
import {
  AppointmentResponseDto,
  BookingContextResponseDto,
} from './dto/appointment-response.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

export const DISPLAY_TIME_ZONE =
  process.env.AGENTCLINIC_DISPLAY_TIME_ZONE ?? 'America/Sao_Paulo';
const appointmentInclude = {
  agent: { select: { id: true, name: true } },
  availabilitySlot: {
    select: {
      startsAt: true,
      durationMinutes: true,
      therapy: { select: { id: true, name: true } },
    },
  },
} as const;

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CurrentTimeService) private readonly clock: CurrentTimeService,
  ) {}

  async getBookingContext(slotId: string): Promise<BookingContextResponseDto> {
    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id: slotId },
      include: {
        therapy: { select: { id: true, name: true } },
        appointment: { select: { id: true } },
      },
    });
    if (!slot) throw new NotFoundException('Availability slot not found');
    if (
      !slot.isAvailable ||
      slot.startsAt <= this.clock.now() ||
      slot.appointment
    )
      throw new ConflictException('This slot is no longer available');
    return new BookingContextResponseDto(slot, DISPLAY_TIME_ZONE);
  }

  async create(
    input: CreateAppointmentDto,
    idempotencyKey: string,
  ): Promise<{ created: boolean; appointment: AppointmentResponseDto }> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const replay = await tx.appointment.findUnique({
          where: { idempotencyKey },
          include: appointmentInclude,
        });
        if (replay) {
          const same =
            replay.availabilitySlotId === input.availabilitySlotId &&
            replay.agentId === input.agentId &&
            replay.visitorName === input.visitorName &&
            replay.visitorEmail === input.visitorEmail;
          if (!same)
            throw new ConflictException(
              'Idempotency key is already used for another request',
            );
          return { created: false, record: replay };
        }
        const slot = await tx.availabilitySlot.findUnique({
          where: { id: input.availabilitySlotId },
          include: { appointment: { select: { id: true } } },
        });
        if (!slot) throw new NotFoundException('Availability slot not found');
        if (
          !slot.isAvailable ||
          slot.startsAt <= this.clock.now() ||
          slot.appointment
        )
          throw new ConflictException('This slot is no longer available');
        const agent = await tx.agent.findUnique({
          where: { id: input.agentId },
          select: { id: true },
        });
        if (!agent) throw new NotFoundException('Agent not found');
        const record = await tx.appointment.create({
          data: {
            id: randomUUID(),
            ...input,
            idempotencyKey,
            status: 'CONFIRMED',
            createdAt: this.clock.now(),
          },
          include: appointmentInclude,
        });
        return { created: true, record };
      });
      return {
        created: result.created,
        appointment: new AppointmentResponseDto(
          result.record,
          DISPLAY_TIME_ZONE,
        ),
      };
    } catch (error: unknown) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      )
        throw error;
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        const replay = await this.prisma.appointment.findUnique({
          where: { idempotencyKey },
          include: appointmentInclude,
        });
        if (
          replay &&
          replay.availabilitySlotId === input.availabilitySlotId &&
          replay.agentId === input.agentId &&
          replay.visitorName === input.visitorName &&
          replay.visitorEmail === input.visitorEmail
        )
          return {
            created: false,
            appointment: new AppointmentResponseDto(replay, DISPLAY_TIME_ZONE),
          };
        throw new ConflictException(
          'This slot or idempotency key is no longer available',
        );
      }
      throw new InternalServerErrorException(
        'Unable to complete the booking safely',
      );
    }
  }

  async findOne(id: string): Promise<AppointmentResponseDto> {
    const record = await this.prisma.appointment.findUnique({
      where: { id },
      include: appointmentInclude,
    });
    if (!record) throw new NotFoundException('Appointment not found');
    return new AppointmentResponseDto(record, DISPLAY_TIME_ZONE);
  }
}
