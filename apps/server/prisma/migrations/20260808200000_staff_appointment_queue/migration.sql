-- Prisma cannot declare SQLite partial indexes. The active-appointment
-- invariant below is intentionally managed in SQL and must survive future
-- migrations: PENDING and CONFIRMED both occupy a slot; CANCELLED is history.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "availabilitySlotId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "visitorEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    "cancelledAt" DATETIME,
    "cancellationSource" TEXT CHECK ("cancellationSource" IS NULL OR "cancellationSource" IN ('AGENT', 'STAFF')),
    "cancellationReasonCode" TEXT CHECK ("cancellationReasonCode" IS NULL OR "cancellationReasonCode" IN ('STAFF_UNAVAILABLE', 'SCHEDULE_CHANGE', 'DUPLICATE_BOOKING', 'OTHER_OPERATIONAL')),
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Appointment_cancellation_state_check" CHECK (
      ("status" IN ('PENDING', 'CONFIRMED') AND "cancelledAt" IS NULL AND "cancellationSource" IS NULL AND "cancellationReasonCode" IS NULL)
      OR
      ("status" = 'CANCELLED' AND "cancelledAt" IS NOT NULL AND "cancellationSource" IS NOT NULL AND (
        ("cancellationSource" = 'AGENT' AND "cancellationReasonCode" IS NULL)
        OR
        ("cancellationSource" = 'STAFF' AND "cancellationReasonCode" IS NOT NULL)
      ))
    ),
    CONSTRAINT "Appointment_availabilitySlotId_fkey" FOREIGN KEY ("availabilitySlotId") REFERENCES "AvailabilitySlot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Appointment" (
  "id", "availabilitySlotId", "agentId", "visitorName", "visitorEmail",
  "status", "cancelledAt", "cancellationSource", "cancellationReasonCode",
  "idempotencyKey", "createdAt"
)
SELECT
  "id", "availabilitySlotId", "agentId", "visitorName", "visitorEmail",
  "status", "cancelledAt",
  CASE WHEN "status" = 'CANCELLED' THEN 'AGENT' ELSE NULL END,
  NULL, "idempotencyKey", "createdAt"
FROM "Appointment";

DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";

CREATE UNIQUE INDEX "Appointment_idempotencyKey_key" ON "Appointment"("idempotencyKey");
CREATE INDEX "Appointment_agentId_idx" ON "Appointment"("agentId");
CREATE INDEX "Appointment_agentId_status_idx" ON "Appointment"("agentId", "status");
CREATE UNIQUE INDEX "Appointment_one_active_per_slot"
ON "Appointment"("availabilitySlotId") WHERE "status" IN ('PENDING', 'CONFIRMED');

CREATE TABLE "AppointmentStatusEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL,
    "fromStatus" TEXT CHECK ("fromStatus" IS NULL OR "fromStatus" IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    "toStatus" TEXT NOT NULL CHECK ("toStatus" IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    "actorType" TEXT NOT NULL CHECK ("actorType" IN ('VISITOR', 'AGENT', 'STAFF', 'SYSTEM')),
    "reasonCode" TEXT CHECK ("reasonCode" IS NULL OR "reasonCode" IN ('STAFF_UNAVAILABLE', 'SCHEDULE_CHANGE', 'DUPLICATE_BOOKING', 'OTHER_OPERATIONAL')),
    "createdAt" DATETIME NOT NULL,
    CONSTRAINT "AppointmentStatusEvent_transition_check" CHECK (
      ("fromStatus" IS NULL)
      OR ("fromStatus" = 'PENDING' AND "toStatus" IN ('CONFIRMED', 'CANCELLED'))
      OR ("fromStatus" = 'CONFIRMED' AND "toStatus" = 'CANCELLED')
    ),
    CONSTRAINT "AppointmentStatusEvent_reason_check" CHECK (
      ("actorType" = 'STAFF' AND "toStatus" = 'CANCELLED' AND "reasonCode" IS NOT NULL)
      OR NOT ("actorType" = 'STAFF' AND "toStatus" = 'CANCELLED') AND "reasonCode" IS NULL
    ),
    CONSTRAINT "AppointmentStatusEvent_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AppointmentStatusEvent_appointmentId_createdAt_id_idx"
ON "AppointmentStatusEvent"("appointmentId", "createdAt", "id");

-- One initial SYSTEM snapshot preserves the current state of every Phase 8
-- Appointment. Cancelled records use cancelledAt as their latest known change;
-- active records use their original createdAt.
INSERT INTO "AppointmentStatusEvent" (
  "id", "appointmentId", "fromStatus", "toStatus", "actorType", "reasonCode", "createdAt"
)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) ||
  substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
  "id", NULL, "status", 'SYSTEM', NULL, COALESCE("cancelledAt", "createdAt")
FROM "Appointment";

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
