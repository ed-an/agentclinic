#!/usr/bin/env node
import { createBackup, restoreBackup } from './lib/sqlite-operations.mjs';

const [command, source, destination] = process.argv.slice(2);
try {
  if (command === 'backup') {
    const result = await createBackup({ source, destination });
    process.stdout.write(
      `${JSON.stringify({ status: 'ok', schemaVersion: result.manifest.schemaVersion, checksum: result.manifest.checksum })}\n`,
    );
  } else if (command === 'restore') {
    const result = await restoreBackup({ backup: source, target: destination });
    process.stdout.write(
      `${JSON.stringify({ status: 'ok', migrationCount: result.migrationCount, tableCounts: result.tableCounts })}\n`,
    );
  } else {
    throw new Error('USAGE_INVALID');
  }
} catch (error) {
  const code =
    error instanceof Error && /^[A-Z0-9_]+$/.test(error.message)
      ? error.message
      : 'SQLITE_OPERATION_FAILED';
  process.stderr.write(`${JSON.stringify({ status: 'error', code })}\n`);
  process.exitCode = 1;
}
