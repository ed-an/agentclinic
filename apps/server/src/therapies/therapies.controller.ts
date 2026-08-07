import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { AvailabilityService } from '../availability/availability.service';
import { AvailabilityQueryDto } from '../availability/dto/availability-query.dto';
import { AvailabilitySlotResponseDto } from '../availability/dto/availability-slot-response.dto';
import { AvailabilityQueryPipe } from '../availability/pipes/availability-query.pipe';
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
    @Inject(AvailabilityService)
    private readonly availabilityService: AvailabilityService,
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

  @Get(':id/availability')
  findAvailability(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query(AvailabilityQueryPipe) query: AvailabilityQueryDto,
  ): Promise<AvailabilitySlotResponseDto[]> {
    return this.availabilityService.findForTherapy(id, query);
  }
}
