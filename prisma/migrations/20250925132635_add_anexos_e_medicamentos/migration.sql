-- CreateEnum
CREATE TYPE "public"."TipoAnexo" AS ENUM ('ENCAMINHAMENTO', 'ATESTADO_DECLARACAO', 'RECEITA_MEDICA', 'RELATORIO', 'OUTRO');

-- CreateEnum
CREATE TYPE "public"."StatusMedicamento" AS ENUM ('ATIVO', 'CONCLUIDO', 'SUSPENSO');

-- CreateTable
CREATE TABLE "public"."AnexoConsulta" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "urlArquivo" TEXT NOT NULL,
    "tipo" "public"."TipoAnexo" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "consultaId" TEXT NOT NULL,

    CONSTRAINT "AnexoConsulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Medicamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "posologia" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "status" "public"."StatusMedicamento" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "profissionalId" TEXT,
    "consultaId" TEXT,
    "tratamentoId" TEXT,

    CONSTRAINT "Medicamento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."AnexoConsulta" ADD CONSTRAINT "AnexoConsulta_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "public"."Consultas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Medicamento" ADD CONSTRAINT "Medicamento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Medicamento" ADD CONSTRAINT "Medicamento_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "public"."Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Medicamento" ADD CONSTRAINT "Medicamento_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "public"."Consultas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Medicamento" ADD CONSTRAINT "Medicamento_tratamentoId_fkey" FOREIGN KEY ("tratamentoId") REFERENCES "public"."Tratamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
