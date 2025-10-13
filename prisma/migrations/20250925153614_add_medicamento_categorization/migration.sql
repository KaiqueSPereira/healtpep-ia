-- CreateEnum
CREATE TYPE "public"."TipoMedicamento" AS ENUM ('USO_CONTINUO', 'TRATAMENTO_CLINICO', 'ESPORADICO');

-- AlterTable
ALTER TABLE "public"."Medicamento" ADD COLUMN     "forma" TEXT,
ADD COLUMN     "tipo" "public"."TipoMedicamento" NOT NULL DEFAULT 'ESPORADICO',
ALTER COLUMN "posologia" DROP NOT NULL;
