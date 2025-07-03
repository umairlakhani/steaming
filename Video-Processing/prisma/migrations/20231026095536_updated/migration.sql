/*
  Warnings:

  - You are about to drop the column `adBreaks` on the `Video` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ScheduleVideo" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "adBreaks";
