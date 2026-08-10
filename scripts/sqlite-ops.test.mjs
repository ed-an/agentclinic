import { strict as assert } from 'node:assert';
import {
  chmod,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import Database from 'better-sqlite3';
import {
  createBackup,
  MANIFEST_SUFFIX,
  restoreBackup,
  safeOperationalPath,
} from './lib/sqlite-operations.mjs';

function representativeDatabase(path) {
  const database = new Database(path);
  database.pragma('foreign_keys = ON');
  database.exec(`
    CREATE TABLE _prisma_migrations (migration_name TEXT, finished_at TEXT, rolled_back_at TEXT);
    CREATE TABLE UserAccount (id TEXT PRIMARY KEY, role TEXT NOT NULL, agentId TEXT);
    CREATE TABLE AuthSession (id TEXT PRIMARY KEY, accountId TEXT NOT NULL REFERENCES UserAccount(id));
    CREATE TABLE Appointment (id TEXT PRIMARY KEY, availabilitySlotId TEXT NOT NULL, status TEXT NOT NULL);
    CREATE TABLE AppointmentStatusEvent (id TEXT PRIMARY KEY, appointmentId TEXT NOT NULL REFERENCES Appointment(id));
    CREATE UNIQUE INDEX Appointment_one_active_per_slot ON Appointment(availabilitySlotId) WHERE status IN ('PENDING', 'CONFIRMED');
  `);
  const migration = database.prepare(
    'INSERT INTO _prisma_migrations VALUES (?, ?, NULL)',
  );
  for (let index = 0; index < 9; index++)
    migration.run(`migration-${index}`, new Date(0).toISOString());
  database
    .prepare("INSERT INTO UserAccount VALUES ('account', 'AGENT', 'agent')")
    .run();
  database
    .prepare("INSERT INTO AuthSession VALUES ('session', 'account')")
    .run();
  database
    .prepare(
      "INSERT INTO Appointment VALUES ('appointment', 'slot', 'CONFIRMED')",
    )
    .run();
  database
    .prepare(
      "INSERT INTO AppointmentStatusEvent VALUES ('event', 'appointment')",
    )
    .run();
  database.close();
}

test('backs up and restores representative Phase 10 state safely and repeatedly', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'agentclinic-backup-test-'));
  try {
    const source = join(directory, 'source.db');
    const backup = join(directory, 'backup.db');
    const restored = join(directory, 'restored.db');
    representativeDatabase(source);
    const created = await createBackup({ source, destination: backup });
    assert.equal(created.manifest.schemaVersion, 9);
    assert.deepEqual(created.tableCounts, {
      UserAccount: 1,
      AuthSession: 1,
      Appointment: 1,
      AppointmentStatusEvent: 1,
    });
    if (process.platform !== 'win32')
      assert.equal((await stat(backup)).mode & 0o077, 0);
    const result = await restoreBackup({ backup, target: restored });
    assert.deepEqual(result.tableCounts, created.tableCounts);
    const database = new Database(restored, { readonly: true });
    assert.equal(database.pragma('integrity_check', { simple: true }), 'ok');
    assert.equal(database.pragma('foreign_key_check').length, 0);
    assert.equal(
      database
        .prepare(
          "SELECT count(*) AS count FROM sqlite_master WHERE name='Appointment_one_active_per_slot'",
        )
        .get().count,
      1,
    );
    database.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('rejects tampering, unsafe paths, overwrite, and partial restore failure', async () => {
  const directory = await mkdtemp(
    join(tmpdir(), 'agentclinic-backup-failure-'),
  );
  try {
    const source = join(directory, 'source.db');
    const backup = join(directory, 'backup.db');
    const target = join(directory, 'target.db');
    representativeDatabase(source);
    await createBackup({ source, destination: backup });
    await writeFile(target, 'occupied');
    await assert.rejects(restoreBackup({ backup, target }), /EEXIST/);
    await rm(target);
    await assert.rejects(
      restoreBackup({ backup, target, injectFailure: true }),
      /RESTORE_INJECTED_FAILURE/,
    );
    await assert.rejects(stat(target));
    const manifestPath = `${backup}${MANIFEST_SUFFIX}`;
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.checksum = '0'.repeat(64);
    await writeFile(manifestPath, JSON.stringify(manifest));
    await assert.rejects(
      restoreBackup({ backup, target }),
      /BACKUP_CHECKSUM_INVALID/,
    );
    assert.throws(
      () => safeOperationalPath('/', 'TARGET'),
      /TARGET_PATH_UNSAFE/,
    );
    assert.throws(
      () => safeOperationalPath('relative.db', 'TARGET'),
      /TARGET_PATH_MUST_BE_ABSOLUTE/,
    );
    await chmod(source, 0o600);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
