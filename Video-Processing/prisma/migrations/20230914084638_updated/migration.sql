-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubscriptionNames" ADD VALUE 'BasicToProfessional';
ALTER TYPE "SubscriptionNames" ADD VALUE 'BasicToBusiness';
ALTER TYPE "SubscriptionNames" ADD VALUE 'ProfessionalToBusiness';

-- AlterTable
ALTER TABLE "Subscriptions" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "willEndAt" BIGINT;

-- AlterTable
ALTER TABLE "UsageTable" ADD COLUMN     "subscriptionId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "premiumUser" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "UsageTable" ADD CONSTRAINT "UsageTable_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
