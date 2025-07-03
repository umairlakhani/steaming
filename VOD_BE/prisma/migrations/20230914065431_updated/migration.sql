/*
  Warnings:

  - The `name` column on the `SubscriptionPlans` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `willEndAt` to the `Subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SubscriptionPlans" DROP COLUMN "name",
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Basic';

-- AlterTable
ALTER TABLE "Subscriptions" ADD COLUMN     "willEndAt" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "UsageTable" ADD COLUMN     "subscriptionId" INTEGER;

-- AddForeignKey
ALTER TABLE "UsageTable" ADD CONSTRAINT "UsageTable_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
