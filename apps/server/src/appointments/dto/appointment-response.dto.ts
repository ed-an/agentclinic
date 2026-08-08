export type AppointmentRecord = Readonly<{
  id: string;
  status: string;
  createdAt: Date;
  agent: { id: string; name: string };
  availabilitySlot: {
    startsAt: Date;
    durationMinutes: number;
    therapy: { id: string; name: string };
  };
}>;

export class AppointmentResponseDto {
  readonly id: string;
  readonly status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  readonly therapy: { id: string; name: string };
  readonly agent: { id: string; name: string };
  readonly startsAt: string;
  readonly endsAt: string;
  readonly durationMinutes: number;
  readonly displayTimeZone: string;
  readonly createdAt: string;

  constructor(record: AppointmentRecord, displayTimeZone: string) {
    this.id = record.id;
    this.status =
      record.status === 'CANCELLED'
        ? 'CANCELLED'
        : record.status === 'PENDING'
          ? 'PENDING'
          : 'CONFIRMED';
    this.therapy = record.availabilitySlot.therapy;
    this.agent = record.agent;
    this.startsAt = record.availabilitySlot.startsAt.toISOString();
    this.durationMinutes = record.availabilitySlot.durationMinutes;
    this.endsAt = new Date(
      record.availabilitySlot.startsAt.getTime() +
        this.durationMinutes * 60_000,
    ).toISOString();
    this.displayTimeZone = displayTimeZone;
    this.createdAt = record.createdAt.toISOString();
  }
}

export type AgentAppointmentRecord = Readonly<{
  id: string;
  status: string;
  cancelledAt: Date | null;
  availabilitySlot: {
    startsAt: Date;
    durationMinutes: number;
    therapy: { id: string; name: string };
  };
}>;

export class AgentAppointmentResponseDto {
  readonly id: string;
  readonly status: 'CONFIRMED' | 'CANCELLED';
  readonly therapy: { id: string; name: string };
  readonly startsAt: string;
  readonly endsAt: string;
  readonly durationMinutes: number;
  readonly cancellationEligible: boolean;
  readonly cancellationDeadline: string;
  readonly displayTimeZone: string;

  constructor(
    record: AgentAppointmentRecord,
    displayTimeZone: string,
    cancellationDeadline: Date,
    cancellationEligible: boolean,
  ) {
    this.id = record.id;
    this.status = record.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED';
    this.therapy = record.availabilitySlot.therapy;
    this.startsAt = record.availabilitySlot.startsAt.toISOString();
    this.durationMinutes = record.availabilitySlot.durationMinutes;
    this.endsAt = new Date(
      record.availabilitySlot.startsAt.getTime() +
        record.availabilitySlot.durationMinutes * 60_000,
    ).toISOString();
    this.cancellationEligible = cancellationEligible;
    this.cancellationDeadline = cancellationDeadline.toISOString();
    this.displayTimeZone = displayTimeZone;
  }
}

export class BookingContextResponseDto {
  readonly slotId: string;
  readonly therapy: { id: string; name: string };
  readonly startsAt: string;
  readonly endsAt: string;
  readonly durationMinutes: number;
  readonly displayTimeZone: string;

  constructor(
    slot: {
      id: string;
      startsAt: Date;
      durationMinutes: number;
      therapy: { id: string; name: string };
    },
    displayTimeZone: string,
  ) {
    this.slotId = slot.id;
    this.therapy = slot.therapy;
    this.startsAt = slot.startsAt.toISOString();
    this.durationMinutes = slot.durationMinutes;
    this.endsAt = new Date(
      slot.startsAt.getTime() + slot.durationMinutes * 60_000,
    ).toISOString();
    this.displayTimeZone = displayTimeZone;
  }
}
