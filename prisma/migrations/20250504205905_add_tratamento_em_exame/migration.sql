/*
  Warnings:

  - You are about to drop the column `resultados` on the `Exame` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Exame" DROP COLUMN "resultados",
ADD COLUMN     "tratamentoId" TEXT;

-- CreateTable
CREATE TABLE "ResultadoExame" (
    "id" TEXT NOT NULL,
    "exameId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "unidade" TEXT,
    "referencia" TEXT,

    CONSTRAINT "ResultadoExame_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Exame" ADD CONSTRAINT "Exame_tratamentoId_fkey" FOREIGN KEY ("tratamentoId") REFERENCES "Tratamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoExame" ADD CONSTRAINT "ResultadoExame_exameId_fkey" FOREIGN KEY ("exameId") REFERENCES "Exame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
