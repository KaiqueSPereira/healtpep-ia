-- CreateEnum
CREATE TYPE "TipoMeta" AS ENUM ('PESO', 'GORDURA_CORPORAL', 'MASSA_MUSCULAR');

-- CreateEnum
CREATE TYPE "StatusMeta" AS ENUM ('ATIVA', 'CONCLUIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "AcompanhamentoCorporal" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "peso" TEXT,
    "imc" TEXT,
    "pescoco" TEXT,
    "torax" TEXT,
    "cintura" TEXT,
    "quadril" TEXT,
    "bracoE" TEXT,
    "bracoD" TEXT,
    "pernaE" TEXT,
    "pernaD" TEXT,
    "pantE" TEXT,
    "pantD" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcompanhamentoCorporal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FotosAcompanhamento" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mimetype" TEXT,
    "arquivo" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acompanhamentoId" TEXT NOT NULL,

    CONSTRAINT "FotosAcompanhamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bioimpedancia" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "gorduraCorporal" TEXT,
    "massaMuscular" TEXT,
    "gorduraVisceral" TEXT,
    "taxaMetabolica" TEXT,
    "idadeCorporal" TEXT,
    "massaOssea" TEXT,
    "aguaCorporal" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bioimpedancia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnexoBioimpedancia" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mimetype" TEXT,
    "arquivo" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bioimpedanciaId" TEXT NOT NULL,

    CONSTRAINT "AnexoBioimpedancia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meta" (
    "id" TEXT NOT NULL,
    "tipo" "TipoMeta" NOT NULL,
    "valorAlvo" TEXT NOT NULL,
    "valorInicial" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "status" "StatusMeta" NOT NULL DEFAULT 'ATIVA',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcompanhamentoCorporal_userId_idx" ON "AcompanhamentoCorporal"("userId");

-- CreateIndex
CREATE INDEX "FotosAcompanhamento_acompanhamentoId_idx" ON "FotosAcompanhamento"("acompanhamentoId");

-- CreateIndex
CREATE INDEX "Bioimpedancia_userId_idx" ON "Bioimpedancia"("userId");

-- CreateIndex
CREATE INDEX "AnexoBioimpedancia_bioimpedanciaId_idx" ON "AnexoBioimpedancia"("bioimpedanciaId");

-- CreateIndex
CREATE INDEX "Meta_userId_idx" ON "Meta"("userId");

-- AddForeignKey
ALTER TABLE "AcompanhamentoCorporal" ADD CONSTRAINT "AcompanhamentoCorporal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotosAcompanhamento" ADD CONSTRAINT "FotosAcompanhamento_acompanhamentoId_fkey" FOREIGN KEY ("acompanhamentoId") REFERENCES "AcompanhamentoCorporal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bioimpedancia" ADD CONSTRAINT "Bioimpedancia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnexoBioimpedancia" ADD CONSTRAINT "AnexoBioimpedancia_bioimpedanciaId_fkey" FOREIGN KEY ("bioimpedanciaId") REFERENCES "Bioimpedancia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meta" ADD CONSTRAINT "Meta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
