/*
  Warnings:

  - Added the required column `size` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `videoId` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "size" INTEGER NOT NULL,
ADD COLUMN     "videoId" TEXT NOT NULL;
