import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  TherapyDetailResponseDto,
  TherapyResponseDto,
} from './dto/therapy-response.dto';

export const therapyFields = {
  id: true,
  name: true,
  summary: true,
  description: true,
} as const;

@Injectable()
export class TherapiesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(): Promise<TherapyResponseDto[]> {
    const therapies = await this.prisma.therapy.findMany({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: therapyFields,
    });

    return therapies.map((therapy) => new TherapyResponseDto(therapy));
  }

  async findOne(id: string): Promise<TherapyDetailResponseDto> {
    const therapy = await this.prisma.therapy.findUnique({
      where: { id },
      select: {
        ...therapyFields,
        ailments: {
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          select: { id: true, name: true },
        },
      },
    });

    if (!therapy) throw new NotFoundException('Therapy not found');

    return new TherapyDetailResponseDto(therapy);
  }
}
