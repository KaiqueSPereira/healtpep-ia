-- CreateTable
CREATE TABLE "ResourceLimit" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "limit" INTEGER NOT NULL,

    CONSTRAINT "ResourceLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceLimit_roleId_idx" ON "ResourceLimit"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceLimit_roleId_resource_key" ON "ResourceLimit"("roleId", "resource");

-- AddForeignKey
ALTER TABLE "ResourceLimit" ADD CONSTRAINT "ResourceLimit_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
