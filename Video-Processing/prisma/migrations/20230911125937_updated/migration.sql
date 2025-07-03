-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('paid', 'unPaid');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'inactive', 'expired');

-- CreateEnum
CREATE TYPE "SubscriptionNames" AS ENUM ('Basic', 'Professional', 'Business');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('AUTHOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "VideoType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationNumber" INTEGER NOT NULL,
    "emailVerificationNumberGeneratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passwordUpdateToken" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "whitelisted" BOOLEAN NOT NULL DEFAULT true,
    "account_active" BOOLEAN NOT NULL DEFAULT true,
    "profile_image" TEXT,
    "type" "UserType" NOT NULL DEFAULT 'AUTHOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vat_number" TEXT NOT NULL DEFAULT '',
    "national_id" TEXT NOT NULL DEFAULT '',
    "invoice_address" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "postal_code" TEXT NOT NULL DEFAULT '',
    "province" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "company_name" TEXT NOT NULL DEFAULT '',
    "plan_selected" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageTable" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "bucketId" TEXT NOT NULL DEFAULT '',
    "from" BIGINT,
    "to" BIGINT,
    "total" BIGINT DEFAULT 0,
    "used" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "left" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlans" (
    "id" SERIAL NOT NULL,
    "name" "SubscriptionNames" NOT NULL DEFAULT 'Basic',
    "price" INTEGER NOT NULL DEFAULT 0,
    "features" TEXT NOT NULL DEFAULT '',
    "storage" INTEGER NOT NULL DEFAULT 0,
    "bandwidth" INTEGER NOT NULL DEFAULT 0,
    "stripeProductId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPlans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscriptions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "subscriptionPlanId" INTEGER NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL DEFAULT '',
    "bucketId" TEXT NOT NULL,
    "recur" BOOLEAN NOT NULL DEFAULT true,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTable" (
    "id" SERIAL NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "stripePaymentStatus" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "stripeRecordCreatedAt" TEXT,
    "amount" INTEGER NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'paid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "Title" TEXT NOT NULL,
    "profile_image" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "length" TEXT NOT NULL DEFAULT '00:00:00',
    "size" INTEGER NOT NULL,
    "videoId" TEXT NOT NULL,
    "processing" BOOLEAN NOT NULL DEFAULT true,
    "adBreaks" TEXT[],
    "archived" BOOLEAN NOT NULL DEFAULT true,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "videoUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "VideoType" NOT NULL DEFAULT 'PUBLIC',
    "thumbnail" TEXT NOT NULL DEFAULT '',
    "url360P" TEXT NOT NULL DEFAULT '',
    "url480P" TEXT NOT NULL DEFAULT '',
    "url720P" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveStreaming" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL DEFAULT 0,
    "streamingId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "noOfUsers" INTEGER DEFAULT 0,
    "thumbnail" TEXT NOT NULL DEFAULT '',
    "Title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveStreaming_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "profile_image" TEXT,
    "name" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Editors" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Editors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoData" (
    "id" SERIAL NOT NULL,
    "videoId" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,

    CONSTRAINT "VideoData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdVideo" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "length" TEXT NOT NULL DEFAULT '',
    "size" INTEGER NOT NULL DEFAULT 0,
    "videoId" TEXT NOT NULL DEFAULT '',
    "skipAd" BOOLEAN NOT NULL DEFAULT false,
    "clickurl" TEXT NOT NULL DEFAULT '',
    "adType" TEXT NOT NULL DEFAULT '',
    "wrapperUrl" TEXT NOT NULL DEFAULT '',
    "processing" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "videoUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdsVideoData" (
    "id" SERIAL NOT NULL,
    "adsVideoId" TEXT NOT NULL,
    "adsVideoUrl" TEXT NOT NULL,
    "length" TEXT NOT NULL DEFAULT '',
    "size" INTEGER NOT NULL,

    CONSTRAINT "AdsVideoData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdSpeed" (
    "id" SERIAL NOT NULL,
    "adVideoId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "adRes" TEXT NOT NULL DEFAULT '',
    "adName" TEXT NOT NULL DEFAULT '',
    "adSpeedAdId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdSpeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zones" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "zoneRes" TEXT NOT NULL DEFAULT '',
    "adSpeedZoneId" TEXT NOT NULL DEFAULT '',
    "zoneName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleVideo" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

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

-- CreateTable
CREATE TABLE "Schedule" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streamAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualEvents" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL DEFAULT -1,
    "eventType" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userIP" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "locationCity" TEXT NOT NULL,
    "locationTimeZone" TEXT NOT NULL,
    "reportedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualEvents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Video_videoId_key" ON "Video"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "LiveStreaming_streamingId_key" ON "LiveStreaming"("streamingId");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_name_key" ON "Channel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AdSpeed_adVideoId_key" ON "AdSpeed"("adVideoId");

-- AddForeignKey
ALTER TABLE "UsageTable" ADD CONSTRAINT "UsageTable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscriptions" ADD CONSTRAINT "Subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscriptions" ADD CONSTRAINT "Subscriptions_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "SubscriptionPlans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTable" ADD CONSTRAINT "PaymentTable_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveStreaming" ADD CONSTRAINT "LiveStreaming_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Editors" ADD CONSTRAINT "Editors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Editors" ADD CONSTRAINT "Editors_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdVideo" ADD CONSTRAINT "AdVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSpeed" ADD CONSTRAINT "AdSpeed_adVideoId_fkey" FOREIGN KEY ("adVideoId") REFERENCES "AdVideo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSpeed" ADD CONSTRAINT "AdSpeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zones" ADD CONSTRAINT "Zones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleVideo" ADD CONSTRAINT "ScheduleVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleVideoData" ADD CONSTRAINT "ScheduleVideoData_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ScheduleVideo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleVideoData" ADD CONSTRAINT "ScheduleVideoData_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("videoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
