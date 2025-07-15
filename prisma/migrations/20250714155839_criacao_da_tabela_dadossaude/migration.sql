/*
  Warnings:

  - You are about to drop the column `CNS` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `dataNascimento` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `sexo` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tipoSanguineo` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_CNS_key";

-- AlterTable
ALTER TABLE "PesoHistorico" ALTER COLUMN "peso" SET DATA TYPE TEXT,
ALTER COLUMN "data" DROP DEFAULT,
ALTER COLUMN "data" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "CNS",
DROP COLUMN "dataNascimento",
DROP COLUMN "sexo",
DROP COLUMN "tipoSanguineo";

-- CreateTable
CREATE TABLE "DadosSaude" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "CNS" TEXT,
    "tipoSanguineo" TEXT,
    "sexo" TEXT,
    "dataNascimento" TEXT,
    "altura" TEXT,

    CONSTRAINT "DadosSaude_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DadosSaude_userId_key" ON "DadosSaude"("userId");

-- AddForeignKey
ALTER TABLE "DadosSaude" ADD CONSTRAINT "DadosSaude_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
