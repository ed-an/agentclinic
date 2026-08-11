import { describe, expect, it } from 'vitest';
import {
  ConfigurationError,
  loadOperationalConfig,
} from './operational-config';

const production = {
  NODE_ENV: 'production',
  DATABASE_URL: 'file:/srv/agentclinic/clinic.db',
  AGENTCLINIC_WEB_ORIGIN: 'https://clinic.example.test',
  AGENTCLINIC_HTTPS: 'true',
};

describe('operational configuration', () => {
  it('loads a safe explicit production contract', () => {
    expect(loadOperationalConfig(production)).toMatchObject({
      environment: 'production',
      https: true,
      trustProxy: false,
      trustedOrigins: ['https://clinic.example.test'],
      instanceCount: 1,
      sqliteWriterMode: 'single',
    });
  });

  it.each([
    [
      { ...production, AGENTCLINIC_WEB_ORIGIN: undefined },
      'CONFIG_ORIGINS_REQUIRED',
    ],
    [{ ...production, AGENTCLINIC_WEB_ORIGIN: '*' }, 'CONFIG_ORIGINS_INVALID'],
    [
      { ...production, AGENTCLINIC_TIME_ZONE: 'not/a-zone' },
      'CONFIG_TIME_ZONE_INVALID',
    ],
    [
      { ...production, DATABASE_URL: 'file:./prisma/dev.db' },
      'CONFIG_DATABASE_URL_UNSAFE',
    ],
    [
      { ...production, AGENTCLINIC_ENABLE_DEMO_ACCOUNTS: 'true' },
      'CONFIG_DEMO_AUTH_UNSAFE',
    ],
    [{ ...production, AGENTCLINIC_HTTPS: 'false' }, 'CONFIG_HTTPS_REQUIRED'],
    [
      { ...production, AGENTCLINIC_TRUST_PROXY: 'true' },
      'CONFIG_PROXY_INVALID',
    ],
    [
      { ...production, AGENTCLINIC_CANCELLATION_CUTOFF_HOURS: 'zero' },
      'CONFIG_CANCELLATION_INVALID',
    ],
    [
      { ...production, AGENTCLINIC_INSTANCE_COUNT: '2' },
      'CONFIG_SINGLE_INSTANCE_REQUIRED',
    ],
    [
      { ...production, AGENTCLINIC_SQLITE_WRITER: 'shared' },
      'CONFIG_SINGLE_WRITER_REQUIRED',
    ],
  ])(
    'rejects unsafe production configuration without including values',
    (environment, code) => {
      expect(() => loadOperationalConfig(environment)).toThrow(
        new ConfigurationError(code),
      );
    },
  );
});
