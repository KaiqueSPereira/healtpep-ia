/*
  Warnings:

  - You are about to drop the column `arquivoExame` on the `Exame` table. All the data in the column will be lost.
  - You are about to drop the column `nomeArquivo` on the `Exame` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Exame" DROP COLUMN "arquivoExame",
DROP COLUMN "nomeArquivo";
