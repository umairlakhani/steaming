/*
  Warnings:

  - You are about to drop the `VideoSchedule` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "videoUrl" TEXT NOT NULL DEFAULT '';

-- DropTable
DROP TABLE "VideoSchedule";

-- CreateTable
CREATE TABLE "VideoData" (
    "id" SERIAL NOT NULL,
    "videoId" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,

    CONSTRAINT "VideoData_pkey" PRIMARY KEY ("id")
);
