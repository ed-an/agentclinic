import { spawnSync } from 'node:child_process';
if (!process.env.RELEASE_TARGET || !process.env.RELEASE_ARTIFACT)
  throw new Error('DEPLOY_EXPLICIT_TARGET_AND_ARTIFACT_REQUIRED');
if (process.env.RELEASE_DEPLOY_AUTHORIZED !== 'true')
  throw new Error('DEPLOY_AUTHORIZATION_REQUIRED');
const command = process.env.RELEASE_DEPLOY_COMMAND;
if (!command) throw new Error('DEPLOY_PROVIDER_COMMAND_REQUIRED');
const result = spawnSync(command, {
  shell: true,
  stdio: 'inherit',
  env: process.env,
});
process.exit(result.status ?? 1);
