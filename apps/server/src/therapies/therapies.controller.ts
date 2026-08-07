import { Controller, Get, Inject, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  TherapyDetailResponseDto,
  TherapyResponseDto,
} from './dto/therapy-response.dto';
import { TherapiesService } from './therapies.service';

@Controller('therapies')
export class TherapiesController {
  constructor(
    @Inject(TherapiesService)
    private readonly therapiesService: TherapiesService,
  ) {}

  @Get()
  findAll(): Promise<TherapyResponseDto[]> {
    return this.therapiesService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<TherapyDetailResponseDto> {
    return this.therapiesService.findOne(id);
  }
}
