-- CreateTable
CREATE TABLE "BiomarkerRule" (
    "id" TEXT NOT NULL,
    "normalizedRawName" TEXT NOT NULL,
    "standardizedName" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "BiomarkerRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BiomarkerRule_normalizedRawName_key" ON "BiomarkerRule"("normalizedRawName");

-- CreateIndex
CREATE INDEX "BiomarkerRule_standardizedName_idx" ON "BiomarkerRule"("standardizedName");

-- CreateIndex
CREATE INDEX "BiomarkerRule_category_idx" ON "BiomarkerRule"("category");
