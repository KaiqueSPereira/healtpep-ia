/*
  Warnings:

  - The values [HORA,DIA,SEMANA,MES] on the enum `FrequenciaTipo` will be removed. If these variants are still used in the database, this will fail.
  - The values [ATIVO,CONCLUIDO,SUSPENSO] on the enum `StatusMedicamento` will be removed. If these variants are still used in the database, this will fail.
  - The values [ENCAMINHAMENTO,ATESTADO_DECLARACAO,RECEITA_MEDICA,RELATORIO,OUTRO] on the enum `TipoAnexo` will be removed. If these variants are still used in the database, this will fail.
  - The values [USO_CONTINUO,TRATAMENTO_CLINICO,ESPORADICO] on the enum `TipoMedicamento` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `tratamentoId` on the `Exame` table. All the data in the column will be lost.
  - You are about to drop the column `tratamentoId` on the `Medicamento` table. All the data in the column will be lost.
  - You are about to drop the `Tratamento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ConsultasToTratamento` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."FrequenciaTipo_new" AS ENUM ('Hora', 'Dia', 'Semana', 'Mes');
ALTER TABLE "public"."Medicamento" ALTER COLUMN "frequenciaTipo" TYPE "public"."FrequenciaTipo_new" USING ("frequenciaTipo"::text::"public"."FrequenciaTipo_new");
ALTER TYPE "public"."FrequenciaTipo" RENAME TO "FrequenciaTipo_old";
ALTER TYPE "public"."FrequenciaTipo_new" RENAME TO "FrequenciaTipo";
DROP TYPE "public"."FrequenciaTipo_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."StatusMedicamento_new" AS ENUM ('Ativo', 'Concluido', 'Suspenso');
ALTER TABLE "public"."Medicamento" ALTER COLUMN "status" TYPE "public"."StatusMedicamento_new" USING ("status"::text::"public"."StatusMedicamento_new");
ALTER TYPE "public"."StatusMedicamento" RENAME TO "StatusMedicamento_old";
ALTER TYPE "public"."StatusMedicamento_new" RENAME TO "StatusMedicamento";
DROP TYPE "public"."StatusMedicamento_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."TipoAnexo_new" AS ENUM ('Encaminhamento', 'Atestado_Declaracao', 'Receita_Medica', 'Relatorio', 'Outro');
ALTER TABLE "public"."AnexoConsulta" ALTER COLUMN "tipo" TYPE "public"."TipoAnexo_new" USING ("tipo"::text::"public"."TipoAnexo_new");
ALTER TYPE "public"."TipoAnexo" RENAME TO "TipoAnexo_old";
ALTER TYPE "public"."TipoAnexo_new" RENAME TO "TipoAnexo";
DROP TYPE "public"."TipoAnexo_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."TipoMedicamento_new" AS ENUM ('Uso_Continuo', 'Tratamento_Clinico', 'Esporadico');
ALTER TABLE "public"."Medicamento" ALTER COLUMN "tipo" TYPE "public"."TipoMedicamento_new" USING ("tipo"::text::"public"."TipoMedicamento_new");
ALTER TYPE "public"."TipoMedicamento" RENAME TO "TipoMedicamento_old";
ALTER TYPE "public"."TipoMedicamento_new" RENAME TO "TipoMedicamento";
DROP TYPE "public"."TipoMedicamento_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Anotacoes" DROP CONSTRAINT "Anotacoes_consultaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Consultas" DROP CONSTRAINT "Consultas_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DadosSaude" DROP CONSTRAINT "DadosSaude_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Endereco" DROP CONSTRAINT "Endereco_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Exame" DROP CONSTRAINT "Exame_tratamentoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Exame" DROP CONSTRAINT "Exame_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Medicamento" DROP CONSTRAINT "Medicamento_tratamentoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PesoHistorico" DROP CONSTRAINT "PesoHistorico_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ResultadoExame" DROP CONSTRAINT "ResultadoExame_exameId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tratamento" DROP CONSTRAINT "Tratamento_profissionalId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tratamento" DROP CONSTRAINT "Tratamento_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_ConsultasToTratamento" DROP CONSTRAINT "_ConsultasToTratamento_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_ConsultasToTratamento" DROP CONSTRAINT "_ConsultasToTratamento_B_fkey";

-- AlterTable
ALTER TABLE "public"."DadosSaude" ADD COLUMN     "alergias" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."Exame" DROP COLUMN "tratamentoId",
ADD COLUMN     "condicaoSaudeId" TEXT;

-- AlterTable
ALTER TABLE "public"."Medicamento" DROP COLUMN "tratamentoId",
ADD COLUMN     "condicaoSaudeId" TEXT,
ADD COLUMN     "linkBula" TEXT,
ADD COLUMN     "principioAtivo" TEXT;

-- DropTable
DROP TABLE "public"."Tratamento";

-- DropTable
DROP TABLE "public"."_ConsultasToTratamento";

-- CreateTable
CREATE TABLE "public"."CondicaoSaude" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "objetivo" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "cidCodigo" TEXT,
    "cidDescricao" TEXT,
    "userId" TEXT NOT NULL,
    "profissionalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CondicaoSaude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_CondicaoSaudeToConsultas" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CondicaoSaudeToConsultas_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CondicaoSaudeToConsultas_B_index" ON "public"."_CondicaoSaudeToConsultas"("B");

-- AddForeignKey
ALTER TABLE "public"."DadosSaude" ADD CONSTRAINT "DadosSaude_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PesoHistorico" ADD CONSTRAINT "PesoHistorico_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Consultas" ADD CONSTRAINT "Consultas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Anotacoes" ADD CONSTRAINT "Anotacoes_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "public"."Consultas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Endereco" ADD CONSTRAINT "Endereco_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CondicaoSaude" ADD CONSTRAINT "CondicaoSaude_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "public"."Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CondicaoSaude" ADD CONSTRAINT "CondicaoSaude_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Exame" ADD CONSTRAINT "Exame_condicaoSaudeId_fkey" FOREIGN KEY ("condicaoSaudeId") REFERENCES "public"."CondicaoSaude"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Exame" ADD CONSTRAINT "Exame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResultadoExame" ADD CONSTRAINT "ResultadoExame_exameId_fkey" FOREIGN KEY ("exameId") REFERENCES "public"."Exame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Medicamento" ADD CONSTRAINT "Medicamento_condicaoSaudeId_fkey" FOREIGN KEY ("condicaoSaudeId") REFERENCES "public"."CondicaoSaude"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CondicaoSaudeToConsultas" ADD CONSTRAINT "_CondicaoSaudeToConsultas_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."CondicaoSaude"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CondicaoSaudeToConsultas" ADD CONSTRAINT "_CondicaoSaudeToConsultas_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Consultas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
