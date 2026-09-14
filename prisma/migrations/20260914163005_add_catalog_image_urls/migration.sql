-- AlterTable
ALTER TABLE "extras" ADD COLUMN     "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "finish_levels" ADD COLUMN     "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "models" ADD COLUMN     "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
