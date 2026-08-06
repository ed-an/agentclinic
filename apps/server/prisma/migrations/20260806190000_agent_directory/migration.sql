-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "summary" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Agent_name_id_idx" ON "Agent"("name", "id");
