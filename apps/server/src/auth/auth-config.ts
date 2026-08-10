import { ForbiddenException } from '@nestjs/common';

const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3200',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3200',
];

export function trustedOrigins(): string[] {
  const configured = process.env.AGENTCLINIC_WEB_ORIGIN;
  if (!configured && process.env.NODE_ENV === 'production') {
    throw new Error('AGENTCLINIC_WEB_ORIGIN must be configured in production');
  }
  const values = configured ? configured.split(',') : DEFAULT_ORIGINS;
  return values.map((value) => {
    const origin = value.trim();
    const url = new URL(origin);
    if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol))
      throw new Error('AGENTCLINIC_WEB_ORIGIN must contain exact HTTP origins');
    return origin;
  });
}

export function requireTrustedOrigin(origin: string | undefined): void {
  if (!origin || !trustedOrigins().includes(origin))
    throw new ForbiddenException('Request origin is not allowed');
}

export function safeReturnPath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 1024) return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\'))
    return null;
  try {
    if (decodeURIComponent(value) !== value) return null;
    const parsed = new URL(value, 'http://agentclinic.invalid');
    if (parsed.origin !== 'http://agentclinic.invalid') return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}
