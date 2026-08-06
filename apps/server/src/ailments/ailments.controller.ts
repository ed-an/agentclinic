import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { AilmentsService } from './ailments.service';
import { AilmentResponseDto } from './dto/ailment-response.dto';
import { AilmentSearchQueryPipe } from './pipes/ailment-search-query.pipe';

@Controller('ailments')
export class AilmentsController {
  constructor(
    @Inject(AilmentsService) private readonly ailmentsService: AilmentsService,
  ) {}

  @Get()
  findAll(
    @Query('q', AilmentSearchQueryPipe) query?: string,
  ): Promise<AilmentResponseDto[]> {
    return this.ailmentsService.findAll(query);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<AilmentResponseDto> {
    return this.ailmentsService.findOne(id);
  }
}
