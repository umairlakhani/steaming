-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "midRoll" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "midRollConfig" JSONB,
ADD COLUMN     "postRoll" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preRoll" BOOLEAN NOT NULL DEFAULT false;
