/*
  Warnings:

  - You are about to drop the column `adsVideoDataId` on the `AdSpeed` table. All the data in the column will be lost.
  - You are about to drop the column `clickurl` on the `AdSpeed` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `AdSpeed` table. All the data in the column will be lost.
  - You are about to drop the column `skipAd` on the `AdSpeed` table. All the data in the column will be lost.
  - You are about to drop the column `videourl` on the `AdSpeed` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AdSpeed" DROP CONSTRAINT "AdSpeed_adsVideoDataId_fkey";

-- AlterTable
ALTER TABLE "AdSpeed" DROP COLUMN "adsVideoDataId",
DROP COLUMN "clickurl",
DROP COLUMN "name",
DROP COLUMN "skipAd",
DROP COLUMN "videourl",
ADD COLUMN     "adRes" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;
