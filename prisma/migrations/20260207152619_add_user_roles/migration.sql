-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'PRO', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
