-- CreateEnum
CREATE TYPE "VideoType" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "type" "VideoType" NOT NULL DEFAULT 'PUBLIC';
