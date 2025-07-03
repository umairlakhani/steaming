/*
  Warnings:

  - You are about to drop the `adSpeed` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "adSpeed" DROP CONSTRAINT "adSpeed_adsVideoId_fkey";

-- DropTable
DROP TABLE "adSpeed";

-- CreateTable
CREATE TABLE "AdSpeed" (
    "id" SERIAL NOT NULL,
    "adVideoId" INTEGER NOT NULL,
    "skipAd" BOOLEAN NOT NULL,
    "videourl" TEXT NOT NULL,
    "clickurl" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "adsVideoDataId" INTEGER,

    CONSTRAINT "AdSpeed_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AdSpeed" ADD CONSTRAINT "AdSpeed_adVideoId_fkey" FOREIGN KEY ("adVideoId") REFERENCES "AdVideo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSpeed" ADD CONSTRAINT "AdSpeed_adsVideoDataId_fkey" FOREIGN KEY ("adsVideoDataId") REFERENCES "AdsVideoData"("id") ON DELETE SET NULL ON UPDATE CASCADE;
