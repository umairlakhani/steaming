/*
  Warnings:

  - You are about to drop the `Events` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Events";

-- CreateTable
CREATE TABLE "ManualEvents" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userIP" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "locationCity" TEXT NOT NULL,
    "locationTimeZone" TEXT NOT NULL,
    "reportedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataJson" JSONB NOT NULL,

    CONSTRAINT "ManualEvents_pkey" PRIMARY KEY ("id")
);
