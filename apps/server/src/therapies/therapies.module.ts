import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { TherapiesController } from './therapies.controller';
import { TherapiesService } from './therapies.service';

@Module({
  imports: [AvailabilityModule],
  controllers: [TherapiesController],
  providers: [TherapiesService],
})
export class TherapiesModule {}
