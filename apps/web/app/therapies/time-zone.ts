import type { AvailabilitySlot } from './therapy-api';

export const DEFAULT_DISPLAY_TIME_ZONE = 'America/Sao_Paulo';

export function getDisplayTimeZone(
  environment: Readonly<{ AGENTCLINIC_TIME_ZONE?: string }> = {
    AGENTCLINIC_TIME_ZONE: process.env.AGENTCLINIC_TIME_ZONE,
  },
): string {
  const timeZone =
    environment.AGENTCLINIC_TIME_ZONE?.trim() || DEFAULT_DISPLAY_TIME_ZONE;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(0);
  } catch {
    throw new Error('AGENTCLINIC_TIME_ZONE must be a valid IANA timezone');
  }
  return timeZone;
}

type FormattedAvailabilitySlot = Readonly<{
  id: string;
  startsAt: string;
  endsAt: string;
  timeLabel: string;
  durationLabel: string;
  timeZoneLabel: string;
}>;

export function formatSlot(
  slot: AvailabilitySlot,
  timeZone: string,
): FormattedAvailabilitySlot & { dateLabel: string } {
  const group = groupAvailabilitySlots([slot], timeZone)[0];
  return { ...group.slots[0], dateLabel: group.dateLabel };
}

export type AvailabilityGroup = Readonly<{
  key: string;
  dateLabel: string;
  slots: FormattedAvailabilitySlot[];
}>;

export function groupAvailabilitySlots(
  slots: AvailabilitySlot[],
  timeZone: string,
): AvailabilityGroup[] {
  const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateLabelFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  });
  const zoneFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'short',
  });

  const groups = new Map<string, AvailabilityGroup>();
  for (const slot of slots) {
    const start = new Date(slot.startsAt);
    const end = new Date(slot.endsAt);
    const key = dateKeyFormatter.format(start);
    const zonePart = zoneFormatter
      .formatToParts(start)
      .find(({ type }) => type === 'timeZoneName')?.value;
    const formatted: FormattedAvailabilitySlot = {
      id: slot.id,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      timeLabel: `${timeFormatter.format(start)}–${timeFormatter.format(end)}`,
      durationLabel: `${slot.durationMinutes} minutes`,
      timeZoneLabel: `${zonePart ?? timeZone} (${timeZone})`,
    };
    const existing = groups.get(key);
    if (existing) existing.slots.push(formatted);
    else {
      groups.set(key, {
        key,
        dateLabel: dateLabelFormatter.format(start),
        slots: [formatted],
      });
    }
  }
  return [...groups.values()];
}
