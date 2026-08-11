import { accessSync, constants, statSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

const required = [
  'DATABASE_URL',
  'AGENTCLINIC_WEB_ORIGIN',
  'AGENTCLINIC_API_URL',
  'AGENTCLINIC_HTTPS',
  'AGENTCLINIC_TIME_ZONE',
  'AGENTCLINIC_INSTANCE_COUNT',
  'AGENTCLINIC_SQLITE_WRITER',
];
for (const name of required)
  if (!process.env[name]) throw new Error(`PREFLIGHT_REQUIRED:${name}`);
if (process.env.NODE_ENV !== 'production')
  throw new Error('PREFLIGHT_PRODUCTION_REQUIRED');
if (process.env.AGENTCLINIC_HTTPS !== 'true')
  throw new Error('PREFLIGHT_HTTPS_REQUIRED');
if (process.env.AGENTCLINIC_INSTANCE_COUNT !== '1')
  throw new Error('PREFLIGHT_SINGLE_INSTANCE_REQUIRED');
if (process.env.AGENTCLINIC_SQLITE_WRITER !== 'single')
  throw new Error('PREFLIGHT_SINGLE_WRITER_REQUIRED');
if (!process.env.DATABASE_URL.startsWith('file:'))
  throw new Error('PREFLIGHT_SQLITE_REQUIRED');
const databasePath = process.env.DATABASE_URL.slice(5);
if (!isAbsolute(databasePath) || databasePath.includes('dev.db'))
  throw new Error('PREFLIGHT_DATABASE_PATH_UNSAFE');
const directory = resolve(dirname(databasePath));
accessSync(directory, constants.R_OK | constants.W_OK);
if (!statSync(directory).isDirectory())
  throw new Error('PREFLIGHT_DATABASE_DIRECTORY_INVALID');
for (const name of ['AGENTCLINIC_WEB_ORIGIN', 'AGENTCLINIC_API_URL']) {
  const value = new URL(process.env[name]);
  if (value.protocol !== 'https:' || value.username || value.password)
    throw new Error(`PREFLIGHT_URL_INVALID:${name}`);
}
new Intl.DateTimeFormat('en', {
  timeZone: process.env.AGENTCLINIC_TIME_ZONE,
}).format(new Date(0));
console.log('release.preflight.ok');
