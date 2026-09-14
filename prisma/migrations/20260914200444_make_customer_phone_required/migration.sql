/*
  Warnings:

  - Made the column `customerPhone` on table `quotes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "quotes" ALTER COLUMN "customerPhone" SET NOT NULL;
