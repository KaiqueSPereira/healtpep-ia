-- CreateEnum
CREATE TYPE "public"."FrequenciaTipo" AS ENUM ('HORA', 'DIA', 'SEMANA', 'MES');

-- AlterTable
ALTER TABLE "public"."Medicamento" ADD COLUMN     "frequenciaNumero" INTEGER,
ADD COLUMN     "frequenciaTipo" "public"."FrequenciaTipo",
ADD COLUMN     "quantidadeCaixa" INTEGER,
ADD COLUMN     "quantidadeDose" DOUBLE PRECISION,
ALTER COLUMN "estoque" DROP NOT NULL;
