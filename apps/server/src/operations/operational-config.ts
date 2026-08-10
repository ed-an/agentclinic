import { getDatabaseUrl } from '../database/database-url';

export type OperationalConfig = Readonly<{
  environment: 'development' | 'test' | 'production';
  serviceName: 'agentclinic-server';
  port: number;
  databaseUrl: string;
  timeZone: string;
  cancellationCutoffHours: number;
  trustedOrigins: string[];
  trustProxy: false | 'loopback';
  https: boolean;
  shutdownTimeoutMs: number;
}>;

export class ConfigurationError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'ConfigurationError';
  }
}

function exactOrigins(
  value: string | undefined,
  production: boolean,
): string[] {
  if (!value && production)
    throw new ConfigurationError('CONFIG_ORIGINS_REQUIRED');
  const defaults = [
    'http://localhost:3000',
    'http://localhost:3200',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3200',
  ];
  const origins = value
    ? value.split(',').map((item) => item.trim())
    : defaults;
  if (origins.length === 0 || origins.some((origin) => origin === '*'))
    throw new ConfigurationError('CONFIG_ORIGINS_INVALID');
  try {
    for (const origin of origins) {
      const parsed = new URL(origin);
      if (
        parsed.origin !== origin ||
        !['http:', 'https:'].includes(parsed.protocol) ||
        parsed.username ||
        parsed.password ||
        (production &&
          parsed.protocol !== 'https:' &&
          !['localhost', '127.0.0.1'].includes(parsed.hostname))
      )
        throw new Error();
    }
  } catch {
    throw new ConfigurationError('CONFIG_ORIGINS_INVALID');
  }
  return [...new Set(origins)];
}

function positiveNumber(
  value: string | undefined,
  fallback: number,
  code: string,
): number {
  const result = value === undefined ? fallback : Number(value);
  if (!Number.isFinite(result) || result <= 0)
    throw new ConfigurationError(code);
  return result;
}

export function loadOperationalConfig(
  environment: NodeJS.ProcessEnv = process.env,
): OperationalConfig {
  const nodeEnvironment = environment.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(nodeEnvironment))
    throw new ConfigurationError('CONFIG_ENVIRONMENT_INVALID');
  const production = nodeEnvironment === 'production';
  const timeZone = environment.AGENTCLINIC_TIME_ZONE ?? 'America/Sao_Paulo';
  try {
    new Intl.DateTimeFormat('en', { timeZone }).format(new Date(0));
  } catch {
    throw new ConfigurationError('CONFIG_TIME_ZONE_INVALID');
  }
  let databaseUrl: string;
  try {
    databaseUrl = getDatabaseUrl(environment);
  } catch {
    throw new ConfigurationError('CONFIG_DATABASE_URL_INVALID');
  }
  if (production && databaseUrl.includes('dev.db'))
    throw new ConfigurationError('CONFIG_DATABASE_URL_UNSAFE');
  if (production && environment.AGENTCLINIC_ENABLE_DEMO_ACCOUNTS === 'true')
    throw new ConfigurationError('CONFIG_DEMO_AUTH_UNSAFE');
  const proxy = environment.AGENTCLINIC_TRUST_PROXY ?? 'false';
  if (!['false', 'loopback'].includes(proxy))
    throw new ConfigurationError('CONFIG_PROXY_INVALID');
  const https = environment.AGENTCLINIC_HTTPS === 'true';
  if (production && !https)
    throw new ConfigurationError('CONFIG_HTTPS_REQUIRED');

  return {
    environment: nodeEnvironment as OperationalConfig['environment'],
    serviceName: 'agentclinic-server',
    port: positiveNumber(environment.PORT, 3001, 'CONFIG_PORT_INVALID'),
    databaseUrl,
    timeZone,
    cancellationCutoffHours: positiveNumber(
      environment.AGENTCLINIC_CANCELLATION_CUTOFF_HOURS,
      24,
      'CONFIG_CANCELLATION_INVALID',
    ),
    trustedOrigins: exactOrigins(
      environment.AGENTCLINIC_WEB_ORIGIN,
      production,
    ),
    trustProxy: proxy === 'loopback' ? 'loopback' : false,
    https,
    shutdownTimeoutMs: positiveNumber(
      environment.AGENTCLINIC_SHUTDOWN_TIMEOUT_MS,
      10_000,
      'CONFIG_SHUTDOWN_TIMEOUT_INVALID',
    ),
  };
}
