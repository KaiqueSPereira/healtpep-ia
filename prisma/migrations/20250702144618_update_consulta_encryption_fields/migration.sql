/*
  Warnings:

  - You are about to drop the column `queixas` on the `Consultas` table. All the data in the column will be lost.
  - You are about to drop the column `tratamento` on the `Consultas` table. All the data in the column will be lost.
  - Added the required column `motivoCriptografado` to the `Consultas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Exame" DROP CONSTRAINT "Exame_profissionalId_fkey";

-- AlterTable
ALTER TABLE "Consultas" DROP COLUMN "queixas",
DROP COLUMN "tratamento",
ADD COLUMN     "motivoCriptografado" TEXT NOT NULL,
ADD COLUMN     "queixasAnotacoesCriptografado" TEXT;

-- AlterTable
ALTER TABLE "Exame" ADD COLUMN     "tipo" TEXT,
ALTER COLUMN "profissionalId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ResultadoExame" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "Exame" ADD CONSTRAINT "Exame_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
