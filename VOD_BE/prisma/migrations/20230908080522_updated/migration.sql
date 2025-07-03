/*
  Warnings:

  - You are about to alter the column `storage` on the `SubscriptionPlans` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "SubscriptionPlans" ALTER COLUMN "storage" SET DEFAULT 0,
ALTER COLUMN "storage" SET DATA TYPE INTEGER;
