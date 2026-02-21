-- AlterTable
ALTER TABLE "Exame" ADD COLUMN     "profissionalExecutanteId" TEXT;

-- CreateIndex
CREATE INDEX "Exame_profissionalExecutanteId_idx" ON "Exame"("profissionalExecutanteId");

-- AddForeignKey
ALTER TABLE "Exame" ADD CONSTRAINT "Exame_profissionalExecutanteId_fkey" FOREIGN KEY ("profissionalExecutanteId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
