type AvailabilitySlotSource = Readonly<{
  id: string;
  therapyId: string;
  startsAt: Date;
  durationMinutes: number;
}>;

export class AvailabilitySlotResponseDto {
  readonly id: string;
  readonly therapyId: string;
  readonly startsAt: string;
  readonly durationMinutes: number;
  readonly endsAt: string;

  constructor(slot: AvailabilitySlotSource) {
    this.id = slot.id;
    this.therapyId = slot.therapyId;
    this.startsAt = slot.startsAt.toISOString();
    this.durationMinutes = slot.durationMinutes;
    this.endsAt = new Date(
      slot.startsAt.getTime() + slot.durationMinutes * 60_000,
    ).toISOString();
  }
}
