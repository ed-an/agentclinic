import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { AvailabilityQueryDto } from '../dto/availability-query.dto';

export const AVAILABILITY_MAX_RANGE_DAYS = 90;
const MAX_RANGE_MILLISECONDS =
  AVAILABILITY_MAX_RANGE_DAYS * 24 * 60 * 60 * 1000;
const ISO_INSTANT_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|([+-])(\d{2}):(\d{2}))$/;

export function parseInstant(
  value: unknown,
  name: 'from' | 'to',
): Date | undefined {
  if (value === undefined) return undefined;
  const match =
    typeof value === 'string' ? ISO_INSTANT_PATTERN.exec(value) : null;
  if (!match) {
    throw new BadRequestException(
      `${name} must be a single ISO 8601 timestamp with a timezone`,
    );
  }

  const [, year, month, day, hour, minute, second, , offsetHour, offsetMinute] =
    match;
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);
  const daysInMonth = new Date(
    Date.UTC(numericYear, numericMonth, 0),
  ).getUTCDate();
  if (
    numericMonth < 1 ||
    numericMonth > 12 ||
    numericDay < 1 ||
    numericDay > daysInMonth ||
    Number(hour) > 23 ||
    Number(minute) > 59 ||
    Number(second) > 59 ||
    (offsetHour !== undefined &&
      (Number(offsetHour) > 23 || Number(offsetMinute) > 59))
  ) {
    throw new BadRequestException(`${name} must identify a valid instant`);
  }

  const instant = new Date(value as string);
  if (Number.isNaN(instant.getTime())) {
    throw new BadRequestException(`${name} must identify a valid instant`);
  }
  return instant;
}

@Injectable()
export class AvailabilityQueryPipe implements PipeTransform<
  Record<string, unknown>,
  AvailabilityQueryDto
> {
  transform(value: Record<string, unknown>): AvailabilityQueryDto {
    const unknownParameters = Object.keys(value).filter(
      (key) => key !== 'from' && key !== 'to',
    );
    if (unknownParameters.length > 0) {
      throw new BadRequestException('Only from and to are supported');
    }

    const from = parseInstant(value.from, 'from');
    const to = parseInstant(value.to, 'to');

    if (from && to) {
      const range = to.getTime() - from.getTime();
      if (range <= 0) {
        throw new BadRequestException('from must be earlier than to');
      }
      if (range > MAX_RANGE_MILLISECONDS) {
        throw new BadRequestException(
          `Availability ranges cannot exceed ${AVAILABILITY_MAX_RANGE_DAYS} days`,
        );
      }
    }

    return { ...(from ? { from } : {}), ...(to ? { to } : {}) };
  }
}
