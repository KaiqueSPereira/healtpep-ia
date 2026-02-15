-- CreateTable
CREATE TABLE "AnexoExame" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mimetype" TEXT,
    "arquivo" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "exameId" TEXT NOT NULL,

    CONSTRAINT "AnexoExame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnexoExame_exameId_idx" ON "AnexoExame"("exameId");

-- AddForeignKey
ALTER TABLE "AnexoExame" ADD CONSTRAINT "AnexoExame_exameId_fkey" FOREIGN KEY ("exameId") REFERENCES "Exame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
