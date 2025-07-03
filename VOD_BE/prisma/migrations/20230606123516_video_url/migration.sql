-- CreateTable
CREATE TABLE "VideoSchedule" (
    "id" SERIAL NOT NULL,
    "videoId" INTEGER NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "streamingRatio" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoSchedule_pkey" PRIMARY KEY ("id")
);
