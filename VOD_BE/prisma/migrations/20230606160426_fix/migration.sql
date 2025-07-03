-- CreateTable
CREATE TABLE "ScheduleVideo" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleVideoData" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "videoId" TEXT NOT NULL,
    "startTimestamp" TIMESTAMP(3) NOT NULL,
    "endTimestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleVideoData_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScheduleVideoData" ADD CONSTRAINT "ScheduleVideoData_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ScheduleVideo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
