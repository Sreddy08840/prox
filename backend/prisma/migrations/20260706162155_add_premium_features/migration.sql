-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "floorPlanUrl" TEXT;

-- AlterTable
ALTER TABLE "unit_types" ADD COLUMN     "brochureUrl" TEXT;

-- AlterTable
ALTER TABLE "units" ADD COLUMN     "xCoord" DOUBLE PRECISION,
ADD COLUMN     "yCoord" DOUBLE PRECISION;
