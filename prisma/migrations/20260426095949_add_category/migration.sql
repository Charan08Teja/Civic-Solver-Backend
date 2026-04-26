-- CreateEnum
CREATE TYPE "Category" AS ENUM ('POTHOLE', 'GARBAGE', 'WATER_LEAKAGE', 'STREETLIGHT', 'ROAD_DAMAGE', 'OTHER');

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "category" "Category";
