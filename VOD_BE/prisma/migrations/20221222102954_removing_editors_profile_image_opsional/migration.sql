/*
  Warnings:

  - You are about to drop the column `editorId` on the `Channel` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Channel" DROP CONSTRAINT "Channel_editorId_fkey";

-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "editorId",
ALTER COLUMN "profile_image" DROP NOT NULL;
