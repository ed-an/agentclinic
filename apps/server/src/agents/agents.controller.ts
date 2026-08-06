import { Controller, Get, Inject, Param, ParseUUIDPipe } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentResponseDto } from './dto/agent-response.dto';

@Controller('agents')
export class AgentsController {
  constructor(
    @Inject(AgentsService) private readonly agentsService: AgentsService,
  ) {}

  @Get()
  findAll(): Promise<AgentResponseDto[]> {
    return this.agentsService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<AgentResponseDto> {
    return this.agentsService.findOne(id);
  }
}
