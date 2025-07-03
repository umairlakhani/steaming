/*
  Warnings:

  - Made the column `streamingId` on table `LiveStreaming` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "LiveStreaming" ALTER COLUMN "streamingId" SET NOT NULL;
