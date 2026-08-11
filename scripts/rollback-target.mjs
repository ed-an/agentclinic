import { spawnSync } from 'node:child_process';
if (!process.env.RELEASE_TARGET || !process.env.RELEASE_ROLLBACK_REVISION)
  throw new Error('ROLLBACK_EXPLICIT_TARGET_AND_REVISION_REQUIRED');
if (process.env.RELEASE_ROLLBACK_AUTHORIZED !== 'true')
  throw new Error('ROLLBACK_AUTHORIZATION_REQUIRED');
const command = process.env.RELEASE_ROLLBACK_COMMAND;
if (!command) throw new Error('ROLLBACK_PROVIDER_COMMAND_REQUIRED');
const result = spawnSync(command, {
  shell: true,
  stdio: 'inherit',
  env: process.env,
});
process.exit(result.status ?? 1);
