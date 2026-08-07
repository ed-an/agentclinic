-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "therapyId" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "durationMinutes" INTEGER NOT NULL CHECK ("durationMinutes" > 0),
    "isAvailable" BOOLEAN NOT NULL,
    CONSTRAINT "AvailabilitySlot_therapyId_fkey" FOREIGN KEY ("therapyId") REFERENCES "Therapy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySlot_therapyId_startsAt_key" ON "AvailabilitySlot"("therapyId", "startsAt");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_therapyId_isAvailable_startsAt_id_idx" ON "AvailabilitySlot"("therapyId", "isAvailable", "startsAt", "id");
