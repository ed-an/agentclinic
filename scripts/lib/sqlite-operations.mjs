import { createHash } from 'node:crypto';
import {
  chmod,
  mkdir,
  open,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, isAbsolute, parse, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const repositoryRoot = resolve(
  fileURLToPath(new URL('../..', import.meta.url)),
);
const developmentDatabase = resolve(
  repositoryRoot,
  'apps/server/prisma/dev.db',
);
export const MANIFEST_SUFFIX = '.manifest.json';

export function safeOperationalPath(value, label) {
  if (typeof value !== 'string' || !isAbsolute(value))
    throw new Error(`${label}_PATH_MUST_BE_ABSOLUTE`);
  const path = resolve(value);
  if (
    path === parse(path).root ||
    path === resolve(homedir()) ||
    path === repositoryRoot ||
    path === developmentDatabase
  )
    throw new Error(`${label}_PATH_UNSAFE`);
  return path;
}

async function checksum(path) {
  return createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
}

function inspectDatabase(path) {
  const database = new Database(path, { readonly: true, fileMustExist: true });
  try {
    const integrity = database.pragma('integrity_check', { simple: true });
    if (integrity !== 'ok') throw new Error('SQLITE_INTEGRITY_FAILED');
    const foreignKeys = database.pragma('foreign_key_check');
    if (foreignKeys.length !== 0) throw new Error('SQLITE_FOREIGN_KEY_FAILED');
    const migrations = database
      .prepare(
        'SELECT count(*) AS count FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL',
      )
      .get();
    const activeIndex = database
      .prepare(
        "SELECT count(*) AS count FROM sqlite_master WHERE type='index' AND name='Appointment_one_active_per_slot'",
      )
      .get();
    if (Number(activeIndex.count) !== 1)
      throw new Error('SQLITE_ACTIVE_INDEX_MISSING');
    const tables = [
      'UserAccount',
      'AuthSession',
      'Appointment',
      'AppointmentStatusEvent',
    ];
    const tableCounts = Object.fromEntries(
      tables.map((table) => [
        table,
        Number(
          database.prepare(`SELECT count(*) AS count FROM "${table}"`).get()
            .count,
        ),
      ]),
    );
    return { migrationCount: Number(migrations.count), tableCounts };
  } finally {
    database.close();
  }
}

export async function createBackup({
  source,
  destination,
  appVersion = '0.1.0',
}) {
  const sourcePath = safeOperationalPath(source, 'SOURCE');
  const destinationPath = safeOperationalPath(destination, 'DESTINATION');
  if (sourcePath === destinationPath)
    throw new Error('BACKUP_PATHS_MUST_DIFFER');
  await stat(sourcePath);
  await mkdir(dirname(destinationPath), { recursive: true, mode: 0o700 });
  const handle = await open(destinationPath, 'wx', 0o600);
  await handle.close();
  await rm(destinationPath);
  const temporary = `${destinationPath}.partial`;
  const manifestPath = `${destinationPath}${MANIFEST_SUFFIX}`;
  try {
    await open(manifestPath, 'wx', 0o600).then((file) => file.close());
    await rm(manifestPath);
    const sourceDatabase = new Database(sourcePath, {
      readonly: true,
      fileMustExist: true,
    });
    try {
      await sourceDatabase.backup(temporary);
    } finally {
      sourceDatabase.close();
    }
    await chmod(temporary, 0o600);
    const inspection = inspectDatabase(temporary);
    const details = await stat(temporary);
    const manifest = {
      version: 1,
      createdAt: new Date().toISOString(),
      appVersion,
      schemaVersion: inspection.migrationCount,
      migrationState: 'applied',
      size: details.size,
      checksum: await checksum(temporary),
    };
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
      flag: 'wx',
      mode: 0o600,
    });
    await rename(temporary, destinationPath);
    return { manifest, tableCounts: inspection.tableCounts };
  } catch (error) {
    await rm(temporary, { force: true });
    await rm(manifestPath, { force: true });
    await rm(destinationPath, { force: true });
    throw error;
  }
}

export async function restoreBackup({ backup, target, injectFailure = false }) {
  const backupPath = safeOperationalPath(backup, 'BACKUP');
  const targetPath = safeOperationalPath(target, 'TARGET');
  if (backupPath === targetPath) throw new Error('RESTORE_PATHS_MUST_DIFFER');
  const targetHandle = await open(targetPath, 'wx', 0o600);
  await targetHandle.close();
  await rm(targetPath);
  const temporary = `${targetPath}.partial`;
  try {
    const manifest = JSON.parse(
      await readFile(`${backupPath}${MANIFEST_SUFFIX}`, 'utf8'),
    );
    if (
      manifest.version !== 1 ||
      manifest.checksum !== (await checksum(backupPath))
    )
      throw new Error('BACKUP_CHECKSUM_INVALID');
    const sourceInspection = inspectDatabase(backupPath);
    if (sourceInspection.migrationCount !== manifest.schemaVersion)
      throw new Error('BACKUP_MIGRATION_INCOMPATIBLE');
    const backupDatabase = new Database(backupPath, {
      readonly: true,
      fileMustExist: true,
    });
    try {
      await backupDatabase.backup(temporary);
    } finally {
      backupDatabase.close();
    }
    await chmod(temporary, 0o600);
    if (injectFailure) throw new Error('RESTORE_INJECTED_FAILURE');
    const restored = inspectDatabase(temporary);
    if (
      JSON.stringify(restored.tableCounts) !==
      JSON.stringify(sourceInspection.tableCounts)
    )
      throw new Error('RESTORE_COUNT_MISMATCH');
    await rename(temporary, targetPath);
    return restored;
  } catch (error) {
    await rm(temporary, { force: true });
    await rm(targetPath, { force: true });
    throw error;
  }
}
