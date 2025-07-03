/*
  Warnings:

  - A unique constraint covering the columns `[adVideoId]` on the table `AdSpeed` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AdSpeed_adVideoId_key" ON "AdSpeed"("adVideoId");
