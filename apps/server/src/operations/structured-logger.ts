import { randomUUID } from 'node:crypto';

export const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export function effectiveRequestId(value: unknown): string {
  return typeof value === 'string' && REQUEST_ID_PATTERN.test(value)
    ? value
    : randomUUID();
}

export type LogEvent = Readonly<{
  timestamp: string;
  severity: 'info' | 'warn' | 'error';
  event: string;
  service: string;
  environment: string;
  requestId?: string;
  method?: string;
  route?: string;
  status?: number;
  durationMs?: number;
  errorCode?: string;
}>;

const EVENT_PATTERN = /^[a-z][a-z0-9_.-]{2,63}$/;

export function writeLog(
  event: Omit<LogEvent, 'timestamp'>,
  destination: Pick<NodeJS.WriteStream, 'write'> = event.severity === 'error'
    ? process.stderr
    : process.stdout,
): void {
  if (!EVENT_PATTERN.test(event.event)) throw new Error('LOG_EVENT_INVALID');
  const safe: LogEvent = { timestamp: new Date().toISOString(), ...event };
  destination.write(`${JSON.stringify(safe)}\n`);
}
