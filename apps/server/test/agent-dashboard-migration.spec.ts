import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';

const migrationPath = resolve(
  __dirname,
  '../prisma/migrations/20260808120000_agent_dashboard/migration.sql',
);

describe('Phase 8 Appointment migration', () => {
  it('preserves Phase 7 rows and enforces active-only uniqueness', async () => {
    const database = new DatabaseSync(':memory:');
    try {
      database.exec(`
        PRAGMA foreign_keys=ON;
        CREATE TABLE Agent (id TEXT NOT NULL PRIMARY KEY);
        CREATE TABLE AvailabilitySlot (id TEXT NOT NULL PRIMARY KEY);
        CREATE TABLE Appointment (
          id TEXT NOT NULL PRIMARY KEY,
          availabilitySlotId TEXT NOT NULL UNIQUE,
          agentId TEXT NOT NULL,
          visitorName TEXT NOT NULL,
          visitorEmail TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status = 'CONFIRMED'),
          idempotencyKey TEXT NOT NULL UNIQUE,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (availabilitySlotId) REFERENCES AvailabilitySlot(id),
          FOREIGN KEY (agentId) REFERENCES Agent(id)
        );
        INSERT INTO Agent (id) VALUES ('agent');
        INSERT INTO AvailabilitySlot (id) VALUES ('slot');
        INSERT INTO Appointment
          (id, availabilitySlotId, agentId, visitorName, visitorEmail, status, idempotencyKey, createdAt)
        VALUES
          ('original', 'slot', 'agent', 'Private', 'private@example.test', 'CONFIRMED', 'key-1', '2035-01-01T00:00:00.000Z');
      `);
      database.exec(await readFile(migrationPath, 'utf8'));

      expect(
        database
          .prepare('SELECT id, status, cancelledAt, createdAt FROM Appointment')
          .get(),
      ).toEqual({
        id: 'original',
        status: 'CONFIRMED',
        cancelledAt: null,
        createdAt: '2035-01-01T00:00:00.000Z',
      });
      const index = database
        .prepare(
          "SELECT sql FROM sqlite_master WHERE type='index' AND name='Appointment_one_confirmed_per_slot'",
        )
        .get() as { sql: string };
      expect(index.sql).toContain('WHERE "status" = \'CONFIRMED\'');
      expect(() =>
        database.exec(`
          INSERT INTO Appointment VALUES
          ('duplicate', 'slot', 'agent', 'Private', 'private@example.test', 'CONFIRMED', NULL, 'key-2', CURRENT_TIMESTAMP);
        `),
      ).toThrow(/UNIQUE/);
      database.exec(`
        UPDATE Appointment SET status='CANCELLED', cancelledAt='2035-01-02T00:00:00.000Z' WHERE id='original';
        INSERT INTO Appointment VALUES
          ('historical', 'slot', 'agent', 'Private', 'private@example.test', 'CANCELLED', '2035-01-03T00:00:00.000Z', 'key-3', CURRENT_TIMESTAMP);
        INSERT INTO Appointment VALUES
          ('rebooked', 'slot', 'agent', 'Private', 'private@example.test', 'CONFIRMED', NULL, 'key-4', CURRENT_TIMESTAMP);
      `);
      expect(
        database
          .prepare(
            "SELECT count(*) AS count FROM Appointment WHERE availabilitySlotId='slot' AND status='CANCELLED'",
          )
          .get(),
      ).toEqual({ count: 2 });
      expect(
        database
          .prepare(
            "SELECT count(*) AS count FROM Appointment WHERE availabilitySlotId='slot' AND status='CONFIRMED'",
          )
          .get(),
      ).toEqual({ count: 1 });
      expect(() =>
        database.exec(
          "INSERT INTO Appointment VALUES ('bad-status', 'slot', 'agent', 'Private', 'private@example.test', 'PENDING', NULL, 'key-5', CURRENT_TIMESTAMP)",
        ),
      ).toThrow(/CHECK/);
    } finally {
      database.close();
    }
  });
});
