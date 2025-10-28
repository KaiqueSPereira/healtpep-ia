/*
  Warnings:

  - You are about to drop the column `urlArquivo` on the `AnexoConsulta` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AnexoConsulta" DROP COLUMN "urlArquivo",
ADD COLUMN     "arquivo" BYTEA,
ADD COLUMN     "mimetype" TEXT;

-- AlterTable
ALTER TABLE "Consultas" ADD COLUMN     "consultaOrigemId" TEXT;

-- AddForeignKey
ALTER TABLE "Consultas" ADD CONSTRAINT "Consultas_consultaOrigemId_fkey" FOREIGN KEY ("consultaOrigemId") REFERENCES "Consultas"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
