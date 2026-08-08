import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export const VISITOR_NAME_MAX_LENGTH = 100;
export const VISITOR_EMAIL_MAX_LENGTH = 254;

export type CreateAppointmentDto = Readonly<{
  availabilitySlotId: string;
  agentId: string;
  visitorName: string;
  visitorEmail: string;
}>;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fields = ['availabilitySlotId', 'agentId', 'visitorName', 'visitorEmail'];

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && uuidPattern.test(value);
}

@Injectable()
export class CreateAppointmentPipe implements PipeTransform<
  unknown,
  CreateAppointmentDto
> {
  transform(value: unknown): CreateAppointmentDto {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('Invalid appointment request');
    }
    const input = value as Record<string, unknown>;
    if (
      Object.keys(input).some((key) => !fields.includes(key)) ||
      Object.keys(input).length !== fields.length
    ) {
      throw new BadRequestException('Invalid appointment request fields');
    }
    if (!isUuid(input.availabilitySlotId) || !isUuid(input.agentId)) {
      throw new BadRequestException('Slot and Agent identifiers must be UUIDs');
    }
    if (
      typeof input.visitorName !== 'string' ||
      typeof input.visitorEmail !== 'string'
    ) {
      throw new BadRequestException('Name and email are required');
    }
    const visitorName = input.visitorName.trim();
    const visitorEmail = input.visitorEmail.trim().toLowerCase();
    if (!visitorName || visitorName.length > VISITOR_NAME_MAX_LENGTH) {
      throw new BadRequestException(
        'Name must be between 1 and 100 characters',
      );
    }
    if (
      !visitorEmail ||
      visitorEmail.length > VISITOR_EMAIL_MAX_LENGTH ||
      !emailPattern.test(visitorEmail)
    ) {
      throw new BadRequestException('Enter a valid email address');
    }
    return {
      availabilitySlotId: input.availabilitySlotId,
      agentId: input.agentId,
      visitorName,
      visitorEmail,
    };
  }
}

export function parseIdempotencyKey(
  value: string | string[] | undefined,
): string {
  if (!isUuid(value))
    throw new BadRequestException('Idempotency-Key must be one UUID');
  return value;
}
