-- AlterTable
ALTER TABLE "promotions" ADD COLUMN "code" TEXT;

-- Backfill: promociones existentes reciben un código placeholder
-- generado del id, para que el admin lo cambie por uno real desde el
-- dashboard (issue "promociones con código, no automáticas").
UPDATE "promotions" SET "code" = 'PROMO' || upper(substr(id, 1, 6)) WHERE "code" IS NULL;

ALTER TABLE "promotions" ALTER COLUMN "code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "promotions_developmentId_code_key" ON "promotions"("developmentId", "code");
