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
  AgentAppointmentResponseDto,
  AppointmentResponseDto,
  BookingContextResponseDto,
} from './dto/appointment-response.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancellationPolicyService } from './cancellation-policy.service';
import {
  StaffAppointmentQueryDto,
  StaffAppointmentResponseDto,
  StaffCancellationReasonCode,
} from './dto/staff-appointment.dto';

export const DISPLAY_TIME_ZONE =
  process.env.AGENTCLINIC_TIME_ZONE ?? 'America/Sao_Paulo';
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
const staffAppointmentInclude = {
  agent: { select: { id: true, name: true } },
  availabilitySlot: {
    select: {
      startsAt: true,
      durationMinutes: true,
      therapy: { select: { id: true, name: true } },
    },
  },
  statusEvents: {
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
} as const;

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CurrentTimeService) private readonly clock: CurrentTimeService,
    @Inject(CancellationPolicyService)
    private readonly cancellationPolicy: CancellationPolicyService,
  ) {}

  async getBookingContext(slotId: string): Promise<BookingContextResponseDto> {
    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id: slotId },
      include: {
        therapy: { select: { id: true, name: true } },
        appointments: {
          where: { status: { in: ['PENDING', 'CONFIRMED'] } },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!slot) throw new NotFoundException('Availability slot not found');
    if (
      !slot.isAvailable ||
      slot.startsAt <= this.clock.now() ||
      slot.appointments.length > 0
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
          include: {
            appointments: {
              where: { status: { in: ['PENDING', 'CONFIRMED'] } },
              select: { id: true },
              take: 1,
            },
          },
        });
        if (!slot) throw new NotFoundException('Availability slot not found');
        if (
          !slot.isAvailable ||
          slot.startsAt <= this.clock.now() ||
          slot.appointments.length > 0
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
            status: 'PENDING',
            createdAt: this.clock.now(),
            statusEvents: {
              create: {
                id: randomUUID(),
                fromStatus: null,
                toStatus: 'PENDING',
                actorType: 'VISITOR',
                reasonCode: null,
                createdAt: this.clock.now(),
              },
            },
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

  async findUpcoming(agentId: string): Promise<AgentAppointmentResponseDto[]> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true },
    });
    if (!agent) throw new NotFoundException('Agent not found');
    const now = this.clock.now();
    const records = await this.prisma.appointment.findMany({
      where: {
        agentId,
        status: 'CONFIRMED',
        availabilitySlot: { startsAt: { gt: now } },
      },
      include: {
        availabilitySlot: {
          select: {
            startsAt: true,
            durationMinutes: true,
            therapy: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ availabilitySlot: { startsAt: 'asc' } }, { id: 'asc' }],
    });
    return records.map((record) => this.toAgentAppointment(record, now));
  }

  async cancel(
    agentId: string,
    appointmentId: string,
  ): Promise<AgentAppointmentResponseDto> {
    const now = this.clock.now();
    try {
      const record = await this.prisma.$transaction(async (tx) => {
        const agent = await tx.agent.findUnique({
          where: { id: agentId },
          select: { id: true },
        });
        if (!agent) throw new NotFoundException('Appointment not found');
        const appointment = await tx.appointment.findUnique({
          where: { id: appointmentId },
          include: {
            availabilitySlot: {
              select: {
                startsAt: true,
                durationMinutes: true,
                therapy: { select: { id: true, name: true } },
              },
            },
          },
        });
        if (!appointment || appointment.agentId !== agentId)
          throw new NotFoundException('Appointment not found');
        if (appointment.status === 'CANCELLED') return appointment;
        if (
          appointment.status !== 'CONFIRMED' ||
          !this.cancellationPolicy.isEligible(
            appointment.availabilitySlot.startsAt,
            now,
          )
        )
          throw new ConflictException(
            'This appointment is no longer eligible for cancellation',
          );
        const changed = await tx.appointment.updateMany({
          where: { id: appointmentId, agentId, status: 'CONFIRMED' },
          data: {
            status: 'CANCELLED',
            cancelledAt: now,
            cancellationSource: 'AGENT',
            cancellationReasonCode: null,
          },
        });
        if (changed.count === 1) {
          await tx.appointmentStatusEvent.create({
            data: {
              id: randomUUID(),
              appointmentId,
              fromStatus: 'CONFIRMED',
              toStatus: 'CANCELLED',
              actorType: 'AGENT',
              reasonCode: null,
              createdAt: now,
            },
          });
        }
        const result = await tx.appointment.findUnique({
          where: { id: appointmentId },
          include: {
            availabilitySlot: {
              select: {
                startsAt: true,
                durationMinutes: true,
                therapy: { select: { id: true, name: true } },
              },
            },
          },
        });
        if (!result || (changed.count === 0 && result.status !== 'CANCELLED'))
          throw new ConflictException('Appointment state changed; try again');
        return result;
      });
      return this.toAgentAppointment(record, now);
    } catch (error: unknown) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException(
        'Unable to cancel the appointment safely',
      );
    }
  }

  async findStaffQueue(
    query: StaffAppointmentQueryDto,
  ): Promise<StaffAppointmentResponseDto[]> {
    const now = this.clock.now();
    const records = await this.prisma.appointment.findMany({
      where: {
        ...(query.statuses
          ? { status: { in: query.statuses } }
          : { status: { in: ['PENDING', 'CONFIRMED'] } }),
        ...(query.agentId ? { agentId: query.agentId } : {}),
        availabilitySlot: {
          ...(query.therapyId ? { therapyId: query.therapyId } : {}),
          startsAt: {
            ...(query.from
              ? { gte: query.from }
              : !query.hasExplicitFilters
                ? { gt: now }
                : {}),
            ...(query.to ? { lt: query.to } : {}),
          },
        },
      },
      include: staffAppointmentInclude,
      orderBy: [{ availabilitySlot: { startsAt: 'asc' } }, { id: 'asc' }],
    });
    return records.map(
      (record) =>
        new StaffAppointmentResponseDto(record, DISPLAY_TIME_ZONE, now),
    );
  }

  async confirmStaff(
    appointmentId: string,
  ): Promise<StaffAppointmentResponseDto> {
    const now = this.clock.now();
    try {
      const record = await this.prisma.$transaction(async (tx) => {
        const appointment = await tx.appointment.findUnique({
          where: { id: appointmentId },
          include: staffAppointmentInclude,
        });
        if (!appointment) throw new NotFoundException('Appointment not found');
        if (
          appointment.status === 'CONFIRMED' &&
          appointment.availabilitySlot.startsAt > now
        )
          return appointment;
        if (
          appointment.status !== 'PENDING' ||
          appointment.availabilitySlot.startsAt <= now
        )
          throw new ConflictException(
            'This appointment cannot be confirmed in its current state',
          );
        const changed = await tx.appointment.updateMany({
          where: { id: appointmentId, status: 'PENDING' },
          data: { status: 'CONFIRMED' },
        });
        if (changed.count === 1) {
          await tx.appointmentStatusEvent.create({
            data: {
              id: randomUUID(),
              appointmentId,
              fromStatus: 'PENDING',
              toStatus: 'CONFIRMED',
              actorType: 'STAFF',
              reasonCode: null,
              createdAt: now,
            },
          });
        }
        const result = await tx.appointment.findUnique({
          where: { id: appointmentId },
          include: staffAppointmentInclude,
        });
        if (!result || result.status !== 'CONFIRMED')
          throw new ConflictException('Appointment state changed; try again');
        return result;
      });
      return new StaffAppointmentResponseDto(record, DISPLAY_TIME_ZONE, now);
    } catch (error: unknown) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException(
        'Unable to confirm the appointment safely',
      );
    }
  }

  async cancelStaff(
    appointmentId: string,
    reasonCode: StaffCancellationReasonCode,
  ): Promise<StaffAppointmentResponseDto> {
    const now = this.clock.now();
    try {
      const record = await this.prisma.$transaction(async (tx) => {
        const appointment = await tx.appointment.findUnique({
          where: { id: appointmentId },
          include: staffAppointmentInclude,
        });
        if (!appointment) throw new NotFoundException('Appointment not found');
        if (appointment.status === 'CANCELLED') return appointment;
        if (
          !['PENDING', 'CONFIRMED'].includes(appointment.status) ||
          appointment.availabilitySlot.startsAt <= now
        )
          throw new ConflictException(
            'This appointment cannot be cancelled in its current state',
          );
        const fromStatus = appointment.status;
        const changed = await tx.appointment.updateMany({
          where: {
            id: appointmentId,
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          data: {
            status: 'CANCELLED',
            cancelledAt: now,
            cancellationSource: 'STAFF',
            cancellationReasonCode: reasonCode,
          },
        });
        if (changed.count === 1) {
          await tx.appointmentStatusEvent.create({
            data: {
              id: randomUUID(),
              appointmentId,
              fromStatus,
              toStatus: 'CANCELLED',
              actorType: 'STAFF',
              reasonCode,
              createdAt: now,
            },
          });
        }
        const result = await tx.appointment.findUnique({
          where: { id: appointmentId },
          include: staffAppointmentInclude,
        });
        if (!result || result.status !== 'CANCELLED')
          throw new ConflictException('Appointment state changed; try again');
        return result;
      });
      return new StaffAppointmentResponseDto(record, DISPLAY_TIME_ZONE, now);
    } catch (error: unknown) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException(
        'Unable to cancel the appointment safely',
      );
    }
  }

  private toAgentAppointment(
    record: {
      id: string;
      status: string;
      cancelledAt: Date | null;
      availabilitySlot: {
        startsAt: Date;
        durationMinutes: number;
        therapy: { id: string; name: string };
      };
    },
    now: Date,
  ): AgentAppointmentResponseDto {
    const deadline = this.cancellationPolicy.deadline(
      record.availabilitySlot.startsAt,
    );
    return new AgentAppointmentResponseDto(
      record,
      DISPLAY_TIME_ZONE,
      deadline,
      record.status === 'CONFIRMED' &&
        this.cancellationPolicy.isEligible(
          record.availabilitySlot.startsAt,
          now,
        ),
    );
  }
}
