import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import {
  AVAILABILITY_MAX_RANGE_DAYS,
  parseInstant,
} from '../../availability/pipes/availability-query.pipe';
import { isUuid } from '../dto/create-appointment.dto';
import {
  APPOINTMENT_STATUSES,
  AppointmentStatus,
  StaffAppointmentQueryDto,
} from '../dto/staff-appointment.dto';

const fields = ['status', 'agentId', 'therapyId', 'from', 'to'];
const maxRange = AVAILABILITY_MAX_RANGE_DAYS * 86_400_000;

function one(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string')
    throw new BadRequestException(`${name} must be supplied once`);
  return value;
}

function statuses(value: unknown): AppointmentStatus[] | undefined {
  if (value === undefined) return undefined;
  const rawValues = Array.isArray(value) ? value : [value];
  if (!rawValues.every((item) => typeof item === 'string'))
    throw new BadRequestException('status must use approved values');
  const values = rawValues.flatMap((item) => item.split(','));
  if (
    values.length === 0 ||
    values.some(
      (item) =>
        !item || !APPOINTMENT_STATUSES.includes(item as AppointmentStatus),
    ) ||
    new Set(values).size !== values.length
  )
    throw new BadRequestException('status must use unique approved values');
  return values as AppointmentStatus[];
}

@Injectable()
export class StaffAppointmentQueryPipe implements PipeTransform<
  Record<string, unknown>,
  StaffAppointmentQueryDto
> {
  transform(value: Record<string, unknown>): StaffAppointmentQueryDto {
    if (Object.keys(value).some((key) => !fields.includes(key)))
      throw new BadRequestException('Unsupported staff queue parameter');
    const agentId = one(value.agentId, 'agentId');
    const therapyId = one(value.therapyId, 'therapyId');
    if (agentId !== undefined && !isUuid(agentId))
      throw new BadRequestException('agentId must be a UUID');
    if (therapyId !== undefined && !isUuid(therapyId))
      throw new BadRequestException('therapyId must be a UUID');
    const from = parseInstant(value.from, 'from');
    const to = parseInstant(value.to, 'to');
    if (from && to) {
      const range = to.getTime() - from.getTime();
      if (range <= 0) throw new BadRequestException('from must precede to');
      if (range > maxRange)
        throw new BadRequestException(
          `Staff queue ranges cannot exceed ${AVAILABILITY_MAX_RANGE_DAYS} days`,
        );
    }
    const parsedStatuses = statuses(value.status);
    return {
      ...(parsedStatuses ? { statuses: parsedStatuses } : {}),
      ...(agentId ? { agentId } : {}),
      ...(therapyId ? { therapyId } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      hasExplicitFilters: Object.keys(value).length > 0,
    };
  }
}
