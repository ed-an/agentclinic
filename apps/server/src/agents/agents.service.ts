import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AgentResponseDto } from './dto/agent-response.dto';

@Injectable()
export class AgentsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(): Promise<AgentResponseDto[]> {
    const agents = await this.prisma.agent.findMany({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true, model: true, summary: true },
    });

    return agents.map((agent) => new AgentResponseDto(agent));
  }

  async findOne(id: string): Promise<AgentResponseDto> {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      select: { id: true, name: true, model: true, summary: true },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return new AgentResponseDto(agent);
  }
}
