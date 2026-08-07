-- CreateTable
CREATE TABLE "Therapy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AilmentToTherapy" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_AilmentToTherapy_A_fkey" FOREIGN KEY ("A") REFERENCES "Ailment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AilmentToTherapy_B_fkey" FOREIGN KEY ("B") REFERENCES "Therapy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Therapy_name_key" ON "Therapy"("name");

-- CreateIndex
CREATE INDEX "Therapy_name_id_idx" ON "Therapy"("name", "id");

-- CreateIndex
CREATE UNIQUE INDEX "_AilmentToTherapy_AB_unique" ON "_AilmentToTherapy"("A", "B");

-- CreateIndex
CREATE INDEX "_AilmentToTherapy_B_index" ON "_AilmentToTherapy"("B");
