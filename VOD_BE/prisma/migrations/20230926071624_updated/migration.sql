/*
  Warnings:

  - The values [BasicToProfessional,BasicToBusiness,ProfessionalToBusiness] on the enum `SubscriptionNames` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionNames_new" AS ENUM ('Basic', 'Professional', 'Business', 'BasicToProfessionalPerMonth', 'BasicToBusinessPerMonth', 'ProfessionalToBusinessPerMonth', 'BasicToProfessionalPerYear', 'BasicToBusinessPerYear', 'ProfessionalToBusinessPerYear');
ALTER TABLE "SubscriptionPlans" ALTER COLUMN "name" DROP DEFAULT;
ALTER TABLE "SubscriptionPlans" ALTER COLUMN "name" TYPE "SubscriptionNames_new" USING ("name"::text::"SubscriptionNames_new");
ALTER TYPE "SubscriptionNames" RENAME TO "SubscriptionNames_old";
ALTER TYPE "SubscriptionNames_new" RENAME TO "SubscriptionNames";
DROP TYPE "SubscriptionNames_old";
ALTER TABLE "SubscriptionPlans" ALTER COLUMN "name" SET DEFAULT 'Basic';
COMMIT;
