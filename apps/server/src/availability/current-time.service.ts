import { Injectable } from '@nestjs/common';

@Injectable()
export class CurrentTimeService {
  now(): Date {
    return new Date();
  }
}
