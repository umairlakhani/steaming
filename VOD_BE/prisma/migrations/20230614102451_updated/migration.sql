-- DropIndex
DROP INDEX "AdVideo_videoId_key";

-- AlterTable
ALTER TABLE "AdVideo" ALTER COLUMN "length" SET DEFAULT '',
ALTER COLUMN "size" SET DEFAULT 0,
ALTER COLUMN "videoId" SET DEFAULT '';
