import { afterEach, describe, expect, it } from 'vitest';
import { trustedOrigins } from './auth-config';

const previousNodeEnv = process.env.NODE_ENV;
const previousWebOrigin = process.env.AGENTCLINIC_WEB_ORIGIN;

afterEach(() => {
  if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousNodeEnv;

  if (previousWebOrigin === undefined)
    delete process.env.AGENTCLINIC_WEB_ORIGIN;
  else process.env.AGENTCLINIC_WEB_ORIGIN = previousWebOrigin;
});

describe('trustedOrigins', () => {
  it('supports hostname and numeric loopback origins outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.AGENTCLINIC_WEB_ORIGIN;

    expect(trustedOrigins()).toEqual([
      'http://localhost:3000',
      'http://localhost:3200',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3200',
    ]);
  });

  it('requires explicit trusted origins in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.AGENTCLINIC_WEB_ORIGIN;

    expect(() => trustedOrigins()).toThrow(
      'AGENTCLINIC_WEB_ORIGIN must be configured in production',
    );
  });

  it('accepts exact configured HTTP origins in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.AGENTCLINIC_WEB_ORIGIN =
      'https://clinic.example.test,https://staff.example.test';

    expect(trustedOrigins()).toEqual([
      'https://clinic.example.test',
      'https://staff.example.test',
    ]);
  });
});
