-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dataNascimento" TIMESTAMP(3),
ADD COLUMN     "sexo" TEXT,
ADD COLUMN     "tipoSanguineo" TEXT;

-- CreateTable
CREATE TABLE "PesoHistorico" (
    "id" TEXT NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PesoHistorico_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PesoHistorico" ADD CONSTRAINT "PesoHistorico_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
