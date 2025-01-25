/*
  Warnings:

  - You are about to drop the column `unidadeId` on the `Profissional` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[enderecoId]` on the table `UnidadeDeSaude` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Endereco" DROP CONSTRAINT "Endereco_unidadeId_fkey";

-- DropForeignKey
ALTER TABLE "Profissional" DROP CONSTRAINT "Profissional_unidadeId_fkey";

-- AlterTable
ALTER TABLE "Profissional" DROP COLUMN "unidadeId";

-- CreateTable
CREATE TABLE "_ProfissionalUnidades" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ProfissionalUnidades_AB_unique" ON "_ProfissionalUnidades"("A", "B");

-- CreateIndex
CREATE INDEX "_ProfissionalUnidades_B_index" ON "_ProfissionalUnidades"("B");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadeDeSaude_enderecoId_key" ON "UnidadeDeSaude"("enderecoId");

-- AddForeignKey
ALTER TABLE "UnidadeDeSaude" ADD CONSTRAINT "UnidadeDeSaude_enderecoId_fkey" FOREIGN KEY ("enderecoId") REFERENCES "Endereco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfissionalUnidades" ADD CONSTRAINT "_ProfissionalUnidades_A_fkey" FOREIGN KEY ("A") REFERENCES "Profissional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfissionalUnidades" ADD CONSTRAINT "_ProfissionalUnidades_B_fkey" FOREIGN KEY ("B") REFERENCES "UnidadeDeSaude"("id") ON DELETE CASCADE ON UPDATE CASCADE;
