import { Injectable } from '@nestjs/common';

export const DEFAULT_CANCELLATION_CUTOFF_HOURS = 24;
export const CANCELLATION_CUTOFF_ENV = 'AGENTCLINIC_CANCELLATION_CUTOFF_HOURS';

export function parseCancellationCutoffHours(
  value: string | undefined,
): number {
  if (value === undefined || value.trim() === '')
    return DEFAULT_CANCELLATION_CUTOFF_HOURS;
  if (!/^\d+(?:\.\d+)?$/.test(value.trim()))
    throw new Error(`${CANCELLATION_CUTOFF_ENV} must be a non-negative number`);
  const hours = Number(value);
  if (!Number.isFinite(hours) || hours < 0 || hours > 24 * 365)
    throw new Error(
      `${CANCELLATION_CUTOFF_ENV} must be between 0 and 8760 hours`,
    );
  return hours;
}

@Injectable()
export class CancellationPolicyService {
  readonly cutoffHours = parseCancellationCutoffHours(
    process.env[CANCELLATION_CUTOFF_ENV],
  );
  readonly cutoffMilliseconds = this.cutoffHours * 60 * 60 * 1000;

  deadline(startsAt: Date): Date {
    return new Date(startsAt.getTime() - this.cutoffMilliseconds);
  }

  isEligible(startsAt: Date, now: Date): boolean {
    return startsAt.getTime() > now.getTime() && now <= this.deadline(startsAt);
  }
}
