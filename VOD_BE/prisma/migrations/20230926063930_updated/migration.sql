-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('monthly', 'yearly');

-- AlterTable
ALTER TABLE "SubscriptionPlans" ADD COLUMN     "discount" INTEGER,
ADD COLUMN     "type" "SubscriptionType" NOT NULL DEFAULT 'monthly';
