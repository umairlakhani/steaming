/*
  Warnings:

  - Added the required column `endTime` to the `LiveStreaming` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `LiveStreaming` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LiveStreaming" ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "noOfUsers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL;
