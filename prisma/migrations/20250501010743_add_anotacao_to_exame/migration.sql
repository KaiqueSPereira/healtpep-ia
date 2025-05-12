-- CreateTable
CREATE TABLE "Exame" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeArquivo" TEXT,
    "dataExame" TIMESTAMP(3) NOT NULL,
    "arquivoExame" BYTEA,
    "resultados" JSONB NOT NULL,
    "anotacao" TEXT,
    "userId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "consultaId" TEXT,
    "unidadesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exame_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Exame" ADD CONSTRAINT "Exame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exame" ADD CONSTRAINT "Exame_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exame" ADD CONSTRAINT "Exame_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consultas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exame" ADD CONSTRAINT "Exame_unidadesId_fkey" FOREIGN KEY ("unidadesId") REFERENCES "UnidadeDeSaude"("id") ON DELETE SET NULL ON UPDATE CASCADE;
