/*
  Warnings:

  - The `name` column on the `SubscriptionPlans` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
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
ALTER TABLE "SubscriptionPlans" DROP COLUMN "name",
ADD COLUMN     "name" "SubscriptionNames" NOT NULL DEFAULT 'Basic';
