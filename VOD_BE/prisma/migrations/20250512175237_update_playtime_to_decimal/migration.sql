-- AlterTable
ALTER TABLE "LiveStreaming" ADD COLUMN     "recorded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "streamKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "streamType" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "recorded" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "StreamKey" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL DEFAULT 0,
    "streamKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "recorded" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "StreamKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBandwidth" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "from" BIGINT,
    "to" BIGINT,
    "subscriptionId" INTEGER,
    "total" BIGINT DEFAULT 0,
    "used" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "left" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBandwidth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoAnalytics" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "videoId" TEXT NOT NULL,
    "bandwidth" DOUBLE PRECISION DEFAULT 0,
    "playTime" DECIMAL(65,30) DEFAULT 0,
    "platform" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "VideoAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoDetail" (
    "id" SERIAL NOT NULL,
    "videoId" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "size" INTEGER NOT NULL,

    CONSTRAINT "VideoDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StreamKey_streamKey_key" ON "StreamKey"("streamKey");

-- AddForeignKey
ALTER TABLE "StreamKey" ADD CONSTRAINT "StreamKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBandwidth" ADD CONSTRAINT "UserBandwidth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBandwidth" ADD CONSTRAINT "UserBandwidth_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoAnalytics" ADD CONSTRAINT "VideoAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoAnalytics" ADD CONSTRAINT "VideoAnalytics_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("videoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoDetail" ADD CONSTRAINT "VideoDetail_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("videoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveStreaming" ADD CONSTRAINT "LiveStreaming_streamKey_fkey" FOREIGN KEY ("streamKey") REFERENCES "StreamKey"("streamKey") ON DELETE RESTRICT ON UPDATE CASCADE;
