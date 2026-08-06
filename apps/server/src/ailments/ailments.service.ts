import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AilmentResponseDto } from './dto/ailment-response.dto';

const ailmentFields = {
  id: true,
  name: true,
  summary: true,
  description: true,
} as const;

@Injectable()
export class AilmentsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(query?: string): Promise<AilmentResponseDto[]> {
    const ailments = await this.prisma.ailment.findMany({
      ...(query
        ? {
            where: {
              OR: [
                { name: { contains: query } },
                { summary: { contains: query } },
              ],
            },
          }
        : {}),
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: ailmentFields,
    });

    return ailments.map((ailment) => new AilmentResponseDto(ailment));
  }

  async findOne(id: string): Promise<AilmentResponseDto> {
    const ailment = await this.prisma.ailment.findUnique({
      where: { id },
      select: ailmentFields,
    });

    if (!ailment) throw new NotFoundException('Ailment not found');

    return new AilmentResponseDto(ailment);
  }
}
