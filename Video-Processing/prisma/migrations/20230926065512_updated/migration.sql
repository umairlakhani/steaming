-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bucketId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "stripeCustomerId" TEXT NOT NULL DEFAULT '';
