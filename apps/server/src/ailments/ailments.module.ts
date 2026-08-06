import { Module } from '@nestjs/common';
import { AilmentsController } from './ailments.controller';
import { AilmentsService } from './ailments.service';
import { AilmentSearchQueryPipe } from './pipes/ailment-search-query.pipe';

@Module({
  controllers: [AilmentsController],
  providers: [AilmentsService, AilmentSearchQueryPipe],
})
export class AilmentsModule {}
