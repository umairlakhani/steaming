/*
  Warnings:

  - The `type` column on the `Zones` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ZoneType" AS ENUM ('broadcasting', 'video');

-- AlterTable
ALTER TABLE "Zones" DROP COLUMN "type",
ADD COLUMN     "type" "ZoneType" NOT NULL DEFAULT 'video';
