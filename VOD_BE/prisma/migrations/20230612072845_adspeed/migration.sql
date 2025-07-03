/*
  Warnings:

  - Added the required column `userId` to the `ScheduleVideo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ScheduleVideo" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Video" ALTER COLUMN "length" SET DEFAULT '00:00:00',
ALTER COLUMN "length" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "AdsVideoData" (
    "id" SERIAL NOT NULL,
    "adsVideoId" TEXT NOT NULL,
    "adsVideoUrl" TEXT NOT NULL,
    "length" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,

    CONSTRAINT "AdsVideoData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adSpeed" (
    "id" SERIAL NOT NULL,
    "adsVideoId" INTEGER NOT NULL,
    "adsVideoUrl" TEXT NOT NULL,
    "skipAd" BOOLEAN NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "adSpeed_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScheduleVideo" ADD CONSTRAINT "ScheduleVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleVideoData" ADD CONSTRAINT "ScheduleVideoData_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("videoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adSpeed" ADD CONSTRAINT "adSpeed_adsVideoId_fkey" FOREIGN KEY ("adsVideoId") REFERENCES "AdsVideoData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
