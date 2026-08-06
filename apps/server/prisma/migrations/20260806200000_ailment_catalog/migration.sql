-- CreateTable
CREATE TABLE "Ailment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Ailment_name_id_idx" ON "Ailment"("name", "id");
