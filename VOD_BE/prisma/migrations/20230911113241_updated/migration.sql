-- AlterTable
ALTER TABLE "PaymentTable" ALTER COLUMN "stripeRecordCreatedAt" DROP NOT NULL,
ALTER COLUMN "stripeRecordCreatedAt" SET DATA TYPE TEXT;
