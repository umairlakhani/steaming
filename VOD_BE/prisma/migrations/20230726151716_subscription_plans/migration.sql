-- CreateEnum
CREATE TYPE "SubscriptionNames" AS ENUM ('Basic', 'Professional', 'Business');

-- CreateTable
CREATE TABLE "SubscriptionPlans" (
    "id" SERIAL NOT NULL,
    "name" "SubscriptionNames" NOT NULL,
    "price" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPlans_pkey" PRIMARY KEY ("id")
);
