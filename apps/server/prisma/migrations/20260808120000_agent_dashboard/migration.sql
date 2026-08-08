-- Prisma cannot declare SQLite partial indexes. The active-booking invariant
-- below is intentionally managed in SQL and must survive future migrations.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "availabilitySlotId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "visitorEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK ("status" IN ('CONFIRMED', 'CANCELLED')),
    "cancelledAt" DATETIME,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Appointment_availabilitySlotId_fkey" FOREIGN KEY ("availabilitySlotId") REFERENCES "AvailabilitySlot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Appointment" ("id", "availabilitySlotId", "agentId", "visitorName", "visitorEmail", "status", "idempotencyKey", "createdAt")
SELECT "id", "availabilitySlotId", "agentId", "visitorName", "visitorEmail", "status", "idempotencyKey", "createdAt" FROM "Appointment";

DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";

CREATE UNIQUE INDEX "Appointment_idempotencyKey_key" ON "Appointment"("idempotencyKey");
CREATE INDEX "Appointment_agentId_idx" ON "Appointment"("agentId");
CREATE INDEX "Appointment_agentId_status_idx" ON "Appointment"("agentId", "status");
CREATE UNIQUE INDEX "Appointment_one_confirmed_per_slot"
ON "Appointment"("availabilitySlotId") WHERE "status" = 'CONFIRMED';

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
