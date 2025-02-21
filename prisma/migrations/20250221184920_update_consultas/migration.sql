-- DropForeignKey
ALTER TABLE "Consultas" DROP CONSTRAINT "Consultas_profissionalId_fkey";

-- AlterTable
ALTER TABLE "Consultas" ALTER COLUMN "queixas" DROP NOT NULL,
ALTER COLUMN "profissionalId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "_ProfissionalUnidades" ADD CONSTRAINT "_ProfissionalUnidades_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ProfissionalUnidades_AB_unique";

-- AddForeignKey
ALTER TABLE "Consultas" ADD CONSTRAINT "Consultas_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
