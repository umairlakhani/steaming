-- AlterTable
ALTER TABLE "Subscriptions" ADD COLUMN     "recur" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "stripeSubscriptionId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
