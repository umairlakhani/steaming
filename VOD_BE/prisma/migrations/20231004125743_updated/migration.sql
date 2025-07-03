-- AlterTable
ALTER TABLE "AdVideo" ADD COLUMN     "zoneId" INTEGER;

-- AddForeignKey
ALTER TABLE "AdVideo" ADD CONSTRAINT "AdVideo_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
