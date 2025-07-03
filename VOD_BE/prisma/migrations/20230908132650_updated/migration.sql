/*
  Warnings:

  - The `from` column on the `UsageTable` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `to` column on the `UsageTable` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "UsageTable" DROP COLUMN "from",
ADD COLUMN     "from" INTEGER,
DROP COLUMN "to",
ADD COLUMN     "to" INTEGER;
