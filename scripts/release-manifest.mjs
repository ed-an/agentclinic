import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const required = ['RELEASE_VERSION', 'RELEASE_REVISION', 'SOURCE_DATE_EPOCH'];
for (const name of required) {
  if (!process.env[name]) throw new Error(`RELEASE_INPUT_REQUIRED:${name}`);
}
if (!/^\d+$/.test(process.env.SOURCE_DATE_EPOCH))
  throw new Error('RELEASE_SOURCE_DATE_EPOCH_INVALID');
const files = ['package.json', 'package-lock.json'];
const sha256 = Object.fromEntries(
  files.map((file) => [
    file,
    createHash('sha256')
      .update(readFileSync(resolve(file)))
      .digest('hex'),
  ]),
);
const manifest = {
  schemaVersion: 1,
  version: process.env.RELEASE_VERSION,
  revision: process.env.RELEASE_REVISION,
  createdAt: new Date(
    Number(process.env.SOURCE_DATE_EPOCH) * 1000,
  ).toISOString(),
  node: '24.19.0',
  topology: { serverInstances: 1, webInstances: 1, sqliteWriters: 1 },
  sha256,
};
const output = resolve(
  process.env.RELEASE_MANIFEST_PATH ?? 'release-manifest.json',
);
writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`, {
  flag: 'wx',
  mode: 0o600,
});
console.log(`release.manifest.created ${output}`);
