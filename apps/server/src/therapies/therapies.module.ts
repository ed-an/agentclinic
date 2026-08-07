import { Module } from '@nestjs/common';
import { TherapiesController } from './therapies.controller';
import { TherapiesService } from './therapies.service';

@Module({
  controllers: [TherapiesController],
  providers: [TherapiesService],
})
export class TherapiesModule {}
