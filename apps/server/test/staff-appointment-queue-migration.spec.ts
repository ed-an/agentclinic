import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';

const migrationPath = resolve(
  __dirname,
  '../prisma/migrations/20260808200000_staff_appointment_queue/migration.sql',
);
const accessControlMigrationPath = resolve(
  __dirname,
  '../prisma/migrations/20260809120000_access_control/migration.sql',
);

describe('Phase 9 Appointment migration', () => {
  it('preserves Phase 8 data, snapshots once, and enforces active uniqueness', async () => {
    const database = new DatabaseSync(':memory:');
    try {
      database.exec(`
        PRAGMA foreign_keys=ON;
        CREATE TABLE Agent (id TEXT NOT NULL PRIMARY KEY);
        CREATE TABLE AvailabilitySlot (id TEXT NOT NULL PRIMARY KEY);
        CREATE TABLE Appointment (
          id TEXT NOT NULL PRIMARY KEY,
          availabilitySlotId TEXT NOT NULL,
          agentId TEXT NOT NULL,
          visitorName TEXT NOT NULL,
          visitorEmail TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED')),
          cancelledAt DATETIME,
          idempotencyKey TEXT NOT NULL UNIQUE,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (availabilitySlotId) REFERENCES AvailabilitySlot(id),
          FOREIGN KEY (agentId) REFERENCES Agent(id)
        );
        CREATE UNIQUE INDEX Appointment_one_confirmed_per_slot
          ON Appointment(availabilitySlotId) WHERE status='CONFIRMED';
        INSERT INTO Agent VALUES ('agent');
        INSERT INTO AvailabilitySlot VALUES ('slot-a'), ('slot-b');
        INSERT INTO Appointment VALUES
          ('confirmed', 'slot-a', 'agent', 'Private A', 'a@example.test', 'CONFIRMED', NULL, 'key-a', '2035-01-01T00:00:00.000Z'),
          ('cancelled', 'slot-b', 'agent', 'Private B', 'b@example.test', 'CANCELLED', '2035-01-03T00:00:00.000Z', 'key-b', '2035-01-02T00:00:00.000Z');
      `);
      database.exec(await readFile(migrationPath, 'utf8'));

      expect(
        database
          .prepare(
            'SELECT id, status, cancelledAt, cancellationSource, idempotencyKey, createdAt FROM Appointment ORDER BY id',
          )
          .all(),
      ).toEqual([
        {
          id: 'cancelled',
          status: 'CANCELLED',
          cancelledAt: '2035-01-03T00:00:00.000Z',
          cancellationSource: 'AGENT',
          idempotencyKey: 'key-b',
          createdAt: '2035-01-02T00:00:00.000Z',
        },
        {
          id: 'confirmed',
          status: 'CONFIRMED',
          cancelledAt: null,
          cancellationSource: null,
          idempotencyKey: 'key-a',
          createdAt: '2035-01-01T00:00:00.000Z',
        },
      ]);
      expect(
        database
          .prepare(
            'SELECT appointmentId, fromStatus, toStatus, actorType, createdAt FROM AppointmentStatusEvent ORDER BY appointmentId',
          )
          .all(),
      ).toEqual([
        {
          appointmentId: 'cancelled',
          fromStatus: null,
          toStatus: 'CANCELLED',
          actorType: 'SYSTEM',
          createdAt: '2035-01-03T00:00:00.000Z',
        },
        {
          appointmentId: 'confirmed',
          fromStatus: null,
          toStatus: 'CONFIRMED',
          actorType: 'SYSTEM',
          createdAt: '2035-01-01T00:00:00.000Z',
        },
      ]);
      const index = database
        .prepare(
          "SELECT sql FROM sqlite_master WHERE type='index' AND name='Appointment_one_active_per_slot'",
        )
        .get() as { sql: string };
      expect(index.sql).toContain("status\" IN ('PENDING', 'CONFIRMED')");
      expect(() =>
        database.exec(`INSERT INTO Appointment VALUES
          ('pending-duplicate', 'slot-a', 'agent', 'P', 'p@example.test', 'PENDING', NULL, NULL, NULL, 'key-c', CURRENT_TIMESTAMP)`),
      ).toThrow(/UNIQUE/);
      database.exec(`
        UPDATE Appointment SET status='CANCELLED', cancelledAt='2035-02-01T00:00:00.000Z', cancellationSource='STAFF', cancellationReasonCode='SCHEDULE_CHANGE' WHERE id='confirmed';
        INSERT INTO Appointment VALUES
          ('cancelled-history', 'slot-a', 'agent', 'H', 'h@example.test', 'CANCELLED', '2035-02-02T00:00:00.000Z', 'AGENT', NULL, 'key-d', CURRENT_TIMESTAMP),
          ('rebooked', 'slot-a', 'agent', 'R', 'r@example.test', 'PENDING', NULL, NULL, NULL, 'key-e', CURRENT_TIMESTAMP);
      `);
      expect(
        database
          .prepare(
            "SELECT count(*) AS count FROM Appointment WHERE availabilitySlotId='slot-a' AND status='CANCELLED'",
          )
          .get(),
      ).toEqual({ count: 2 });
      expect(() =>
        database.exec(`INSERT INTO Appointment VALUES
          ('confirmed-duplicate', 'slot-a', 'agent', 'D', 'd@example.test', 'CONFIRMED', NULL, NULL, NULL, 'key-f', CURRENT_TIMESTAMP)`),
      ).toThrow(/UNIQUE/);
      expect(() =>
        database.exec(`INSERT INTO Appointment VALUES
          ('bad-reason', 'slot-b', 'agent', 'B', 'bad@example.test', 'CANCELLED', CURRENT_TIMESTAMP, 'STAFF', NULL, 'key-g', CURRENT_TIMESTAMP)`),
      ).toThrow(/CHECK/);
      const appointmentsBeforeAccessControl = database
        .prepare('SELECT * FROM Appointment ORDER BY id')
        .all();
      const eventsBeforeAccessControl = database
        .prepare('SELECT * FROM AppointmentStatusEvent ORDER BY id')
        .all();
      database.exec(await readFile(accessControlMigrationPath, 'utf8'));
      expect(
        database.prepare('SELECT * FROM Appointment ORDER BY id').all(),
      ).toEqual(appointmentsBeforeAccessControl);
      expect(
        database
          .prepare('SELECT * FROM AppointmentStatusEvent ORDER BY id')
          .all(),
      ).toEqual(eventsBeforeAccessControl);
      expect(
        database
          .prepare(
            "SELECT count(*) AS count FROM sqlite_master WHERE name='Appointment_one_active_per_slot'",
          )
          .get(),
      ).toEqual({ count: 1 });
      expect(() =>
        database.exec(`INSERT INTO UserAccount
          (id, email, passwordHash, role, agentId, isActive, createdAt, updatedAt)
          VALUES ('bad-staff', 'staff@example.test', 'fixture', 'STAFF', 'agent', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`),
      ).toThrow(/CHECK/);
      expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    } finally {
      database.close();
    }
  });
});
