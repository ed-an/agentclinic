import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CurrentTimeService } from '../availability/current-time.service';
import { SIGN_IN_LIMIT, SIGN_IN_WINDOW_MS } from './auth.constants';

interface Bucket {
  failures: number;
  resetAt: number;
}

// This bounded in-memory control protects the single-instance demonstration.
// It is intentionally not presented as a distributed production rate limiter.
@Injectable()
export class SignInThrottleService {
  private readonly buckets = new Map<string, Bucket>();
  private readonly maxBuckets = 1_000;

  constructor(
    @Inject(CurrentTimeService) private readonly clock: CurrentTimeService,
  ) {}

  assertAllowed(keys: string[]): void {
    const now = this.clock.now().getTime();
    this.prune(now);
    if (
      keys.some(
        (key) => (this.buckets.get(key)?.failures ?? 0) >= SIGN_IN_LIMIT,
      )
    )
      throw new HttpException(
        'Sign-in temporarily unavailable',
        HttpStatus.TOO_MANY_REQUESTS,
      );
  }

  recordFailure(keys: string[]): void {
    const now = this.clock.now().getTime();
    for (const key of keys) {
      const existing = this.buckets.get(key);
      this.buckets.set(key, {
        failures:
          existing && existing.resetAt > now ? existing.failures + 1 : 1,
        resetAt:
          existing && existing.resetAt > now
            ? existing.resetAt
            : now + SIGN_IN_WINDOW_MS,
      });
    }
    this.prune(now);
  }

  clear(keys: string[]): void {
    for (const key of keys) this.buckets.delete(key);
  }

  private prune(now: number): void {
    for (const [key, bucket] of this.buckets)
      if (bucket.resetAt <= now) this.buckets.delete(key);
    while (this.buckets.size > this.maxBuckets)
      this.buckets.delete(this.buckets.keys().next().value as string);
  }
}
