-- AlterTable
ALTER TABLE "Zones" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "secondaryZone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT '';
