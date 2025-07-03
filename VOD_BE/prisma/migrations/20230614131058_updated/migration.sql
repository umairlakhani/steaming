/*
  Warnings:

  - You are about to drop the column `adName` on the `AdVideo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AdSpeed" ADD COLUMN     "adName" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "AdVideo" DROP COLUMN "adName";
