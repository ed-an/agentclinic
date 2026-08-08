import { Module } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CurrentTimeService } from './current-time.service';
import { AvailabilityQueryPipe } from './pipes/availability-query.pipe';

@Module({
  providers: [AvailabilityService, AvailabilityQueryPipe, CurrentTimeService],
  exports: [AvailabilityService, AvailabilityQueryPipe, CurrentTimeService],
})
export class AvailabilityModule {}
