import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import {
  STAFF_CANCELLATION_REASON_CODES,
  StaffCancellationDto,
  StaffCancellationReasonCode,
} from '../dto/staff-appointment.dto';

@Injectable()
export class StaffCancellationPipe implements PipeTransform<
  unknown,
  StaffCancellationDto
> {
  transform(value: unknown): StaffCancellationDto {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new BadRequestException('A cancellation reason is required');
    const body = value as Record<string, unknown>;
    if (
      Object.keys(body).length !== 1 ||
      !Object.hasOwn(body, 'reasonCode') ||
      typeof body.reasonCode !== 'string' ||
      !STAFF_CANCELLATION_REASON_CODES.includes(
        body.reasonCode as StaffCancellationReasonCode,
      )
    )
      throw new BadRequestException('Use one approved cancellation reason');
    return { reasonCode: body.reasonCode as StaffCancellationReasonCode };
  }
}
