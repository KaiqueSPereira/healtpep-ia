-- AlterTable
ALTER TABLE "UnidadeDeSaude" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "UnidadeDeSaude" ADD CONSTRAINT "UnidadeDeSaude_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
