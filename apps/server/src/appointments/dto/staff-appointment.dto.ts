export const APPOINTMENT_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const STAFF_CANCELLATION_REASON_CODES = [
  'STAFF_UNAVAILABLE',
  'SCHEDULE_CHANGE',
  'DUPLICATE_BOOKING',
  'OTHER_OPERATIONAL',
] as const;
export type StaffCancellationReasonCode =
  (typeof STAFF_CANCELLATION_REASON_CODES)[number];

export type StaffAppointmentQueryDto = Readonly<{
  statuses?: AppointmentStatus[];
  agentId?: string;
  therapyId?: string;
  from?: Date;
  to?: Date;
  hasExplicitFilters: boolean;
}>;

export type StaffCancellationDto = Readonly<{
  reasonCode: StaffCancellationReasonCode;
}>;

export type StaffAppointmentRecord = Readonly<{
  id: string;
  status: string;
  createdAt: Date;
  agent: { id: string; name: string };
  availabilitySlot: {
    startsAt: Date;
    durationMinutes: number;
    therapy: { id: string; name: string };
  };
  statusEvents: Array<{ createdAt: Date }>;
}>;

export class StaffAppointmentResponseDto {
  readonly id: string;
  readonly status: AppointmentStatus;
  readonly agent: { id: string; name: string };
  readonly therapy: { id: string; name: string };
  readonly startsAt: string;
  readonly endsAt: string;
  readonly durationMinutes: number;
  readonly displayTimeZone: string;
  readonly createdAt: string;
  readonly lastStatusChangedAt: string;
  readonly confirmationAllowed: boolean;
  readonly cancellationAllowed: boolean;

  constructor(
    record: StaffAppointmentRecord,
    displayTimeZone: string,
    now: Date,
  ) {
    this.id = record.id;
    this.status = record.status as AppointmentStatus;
    this.agent = record.agent;
    this.therapy = record.availabilitySlot.therapy;
    this.startsAt = record.availabilitySlot.startsAt.toISOString();
    this.durationMinutes = record.availabilitySlot.durationMinutes;
    this.endsAt = new Date(
      record.availabilitySlot.startsAt.getTime() +
        record.availabilitySlot.durationMinutes * 60_000,
    ).toISOString();
    this.displayTimeZone = displayTimeZone;
    this.createdAt = record.createdAt.toISOString();
    this.lastStatusChangedAt = (
      record.statusEvents[0]?.createdAt ?? record.createdAt
    ).toISOString();
    const future = record.availabilitySlot.startsAt > now;
    this.confirmationAllowed = future && record.status === 'PENDING';
    this.cancellationAllowed =
      future && (record.status === 'PENDING' || record.status === 'CONFIRMED');
  }
}
