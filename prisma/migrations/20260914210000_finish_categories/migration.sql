-- Acabados como categorías con subopciones (issue #58): "Nivel de
-- acabado" plano pasa a ser una opción (finish_levels) dentro de una
-- categoría (finish_categories) con su propio modo de selección
-- (única/múltiple). Los niveles de acabado ya existentes se migran a
-- una categoría "Acabado general" por desarrollo (única), para no
-- perder catálogos ya publicados.

-- CreateEnum
CREATE TYPE "FinishSelectionMode" AS ENUM ('UNICA', 'MULTIPLE');

-- CreateTable
CREATE TABLE "finish_categories" (
    "id" TEXT NOT NULL,
    "developmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "selectionMode" "FinishSelectionMode" NOT NULL DEFAULT 'UNICA',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finish_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "finish_categories_developmentId_idx" ON "finish_categories"("developmentId");

-- AddForeignKey
ALTER TABLE "finish_categories" ADD CONSTRAINT "finish_categories_developmentId_fkey" FOREIGN KEY ("developmentId") REFERENCES "developments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: una categoría "Acabado general" por cada desarrollo que ya
-- tenga niveles de acabado, para no perder catálogos ya publicados.
INSERT INTO "finish_categories" ("id", "developmentId", "name", "selectionMode", "order", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "developmentId", 'Acabado general', 'UNICA', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "finish_levels"
GROUP BY "developmentId";

-- AlterTable: agregar finishCategoryId a finish_levels, nullable
-- primero para poder hacer el backfill antes de exigirlo NOT NULL.
ALTER TABLE "finish_levels" ADD COLUMN "finishCategoryId" TEXT;

UPDATE "finish_levels" fl
SET "finishCategoryId" = fc."id"
FROM "finish_categories" fc
WHERE fc."developmentId" = fl."developmentId" AND fc."name" = 'Acabado general';

ALTER TABLE "finish_levels" ALTER COLUMN "finishCategoryId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "finish_levels_finishCategoryId_idx" ON "finish_levels"("finishCategoryId");

-- AddForeignKey
ALTER TABLE "finish_levels" ADD CONSTRAINT "finish_levels_finishCategoryId_fkey" FOREIGN KEY ("finishCategoryId") REFERENCES "finish_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: quotes pasa de un único finishLevelId a un arreglo
-- finishOptionIds (mismo patrón que extraIds), para permitir varias
-- opciones elegidas a través de varias categorías.
ALTER TABLE "quotes" ADD COLUMN "finishOptionIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "quotes"
SET "finishOptionIds" = ARRAY["finishLevelId"]
WHERE "finishLevelId" IS NOT NULL;

ALTER TABLE "quotes" DROP CONSTRAINT "quotes_finishLevelId_fkey";
ALTER TABLE "quotes" DROP COLUMN "finishLevelId";
