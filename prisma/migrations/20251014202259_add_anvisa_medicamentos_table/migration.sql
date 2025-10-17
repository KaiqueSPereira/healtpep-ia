/*
  Warnings:

  - You are about to drop the column `linkBula` on the `Medicamento` table. All the data in the column will be lost.
  - You are about to drop the column `principioAtivo` on the `Medicamento` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Medicamento" DROP COLUMN "linkBula",
DROP COLUMN "principioAtivo",
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "tipo" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."AnvisaMedicamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "principioAtivo" TEXT NOT NULL,

    CONSTRAINT "AnvisaMedicamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnvisaMedicamento_id_key" ON "public"."AnvisaMedicamento"("id");

-- CreateIndex
CREATE INDEX "AnvisaMedicamento_nome_idx" ON "public"."AnvisaMedicamento"("nome");
