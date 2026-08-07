import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CurrentTimeService } from './current-time.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { AvailabilitySlotResponseDto } from './dto/availability-slot-response.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CurrentTimeService)
    private readonly currentTime: CurrentTimeService,
  ) {}

  async findForTherapy(
    therapyId: string,
    query: AvailabilityQueryDto,
  ): Promise<AvailabilitySlotResponseDto[]> {
    const therapy = await this.prisma.therapy.findUnique({
      where: { id: therapyId },
      select: { id: true },
    });
    if (!therapy) throw new NotFoundException('Therapy not found');

    const from = query.from ?? this.currentTime.now();
    const slots = await this.prisma.availabilitySlot.findMany({
      where: {
        therapyId,
        isAvailable: true,
        startsAt: {
          gte: from,
          ...(query.to ? { lt: query.to } : {}),
        },
      },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        therapyId: true,
        startsAt: true,
        durationMinutes: true,
      },
    });

    return slots.map((slot) => new AvailabilitySlotResponseDto(slot));
  }
}
