/*
  Warnings:

  - A unique constraint covering the columns `[streamingId]` on the table `LiveStreaming` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "LiveStreaming" ALTER COLUMN "streamingId" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "LiveStreaming_streamingId_key" ON "LiveStreaming"("streamingId");
