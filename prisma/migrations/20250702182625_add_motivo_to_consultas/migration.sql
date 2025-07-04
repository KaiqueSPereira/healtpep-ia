/*
  Warnings:

  - You are about to drop the column `motivoCriptografado` on the `Consultas` table. All the data in the column will be lost.
  - You are about to drop the column `queixasAnotacoesCriptografado` on the `Consultas` table. All the data in the column will be lost.
  - Added the required column `motivo` to the `Consultas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Consultas" DROP COLUMN "motivoCriptografado",
DROP COLUMN "queixasAnotacoesCriptografado",
ADD COLUMN     "motivo" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Anotacoes" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "anotacao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anotacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ConsultasToTratamento" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ConsultasToTratamento_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ConsultasToTratamento_B_index" ON "_ConsultasToTratamento"("B");

-- AddForeignKey
ALTER TABLE "Anotacoes" ADD CONSTRAINT "Anotacoes_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consultas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConsultasToTratamento" ADD CONSTRAINT "_ConsultasToTratamento_A_fkey" FOREIGN KEY ("A") REFERENCES "Consultas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConsultasToTratamento" ADD CONSTRAINT "_ConsultasToTratamento_B_fkey" FOREIGN KEY ("B") REFERENCES "Tratamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
