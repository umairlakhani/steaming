-- AlterTable
ALTER TABLE "User" ADD COLUMN     "city" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "company_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "country" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "invoice_address" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "national_id" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "plan_selected" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "postal_code" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "province" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "vat_number" TEXT NOT NULL DEFAULT '';
