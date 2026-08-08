import { describe, expect, it } from 'vitest';
import type { AvailabilitySlot } from './therapy-api';
import {
  DEFAULT_DISPLAY_TIME_ZONE,
  formatInstant,
  getDisplayTimeZone,
  groupAvailabilitySlots,
} from './time-zone';

function slot(
  id: string,
  startsAt: string,
  durationMinutes = 30,
): AvailabilitySlot {
  return {
    id,
    therapyId: '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41',
    startsAt,
    durationMinutes,
    endsAt: new Date(
      new Date(startsAt).getTime() + durationMinutes * 60_000,
    ).toISOString(),
  };
}

describe('availability timezone formatting', () => {
  it('defaults to America/Sao_Paulo and validates configured IANA zones', () => {
    expect(getDisplayTimeZone({})).toBe(DEFAULT_DISPLAY_TIME_ZONE);
    expect(getDisplayTimeZone({ AGENTCLINIC_TIME_ZONE: 'Europe/Paris' })).toBe(
      'Europe/Paris',
    );
    expect(() =>
      getDisplayTimeZone({ AGENTCLINIC_TIME_ZONE: 'Not/A_Zone' }),
    ).toThrow('valid IANA timezone');
  });

  it('groups UTC instants across local midnight in Sao Paulo', () => {
    const groups = groupAvailabilitySlots(
      [
        slot('before-midnight', '2035-06-15T02:30:00.000Z'),
        slot('after-midnight', '2035-06-15T03:30:00.000Z'),
      ],
      'America/Sao_Paulo',
    );

    expect(groups).toHaveLength(2);
    expect(groups.map(({ dateLabel }) => dateLabel)).toEqual([
      expect.stringContaining('June 14, 2035'),
      expect.stringContaining('June 15, 2035'),
    ]);
  });

  it('formats operational timestamps with the same configured timezone', () => {
    expect(
      formatInstant('2035-06-15T02:30:00.000Z', 'America/Sao_Paulo'),
    ).toContain('June 14, 2035');
  });

  it('preserves UTC ordering through nonexistent and repeated New York clock times', () => {
    const spring = groupAvailabilitySlots(
      [
        slot('before-jump', '2035-03-11T06:30:00.000Z'),
        slot('after-jump', '2035-03-11T07:30:00.000Z'),
      ],
      'America/New_York',
    );
    const autumn = groupAvailabilitySlots(
      [
        slot('first-130', '2035-11-04T05:30:00.000Z'),
        slot('second-130', '2035-11-04T06:30:00.000Z'),
      ],
      'America/New_York',
    );

    expect(spring.flatMap(({ slots }) => slots.map(({ id }) => id))).toEqual([
      'before-jump',
      'after-jump',
    ]);
    expect(autumn.flatMap(({ slots }) => slots.map(({ id }) => id))).toEqual([
      'first-130',
      'second-130',
    ]);
    expect(spring[0].slots.map(({ timeLabel }) => timeLabel)).toEqual([
      expect.stringContaining('1:30'),
      expect.stringContaining('3:30'),
    ]);
    expect(autumn[0].slots.map(({ timeLabel }) => timeLabel)).toEqual([
      expect.stringContaining('1:30'),
      expect.stringContaining('1:30'),
    ]);
  });
});
