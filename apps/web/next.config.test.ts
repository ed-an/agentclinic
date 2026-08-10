import { describe, expect, it } from 'vitest';
import nextConfig from './next.config';

describe('Next.js security configuration', () => {
  it('removes disclosure and applies the compatible CSP and headers', async () => {
    expect(nextConfig.poweredByHeader).toBe(false);
    const entries = await nextConfig.headers?.();
    const headers = Object.fromEntries(
      (entries?.[0]?.headers ?? []).map(({ key, value }) => [
        key.toLowerCase(),
        value,
      ]),
    );
    expect(headers['content-security-policy']).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers['content-security-policy']).not.toContain('unsafe-eval');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['permissions-policy']).toContain('camera=()');
  });
});
