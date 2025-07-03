-- AlterTable
ALTER TABLE "SubscriptionPlans" ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[];
