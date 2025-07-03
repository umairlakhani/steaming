/*
  Warnings:

  - You are about to drop the column `destinationUrl` on the `adSpeed` table. All the data in the column will be lost.
  - Added the required column `clickurl` to the `adSpeed` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "adSpeed" DROP COLUMN "destinationUrl",
ADD COLUMN     "clickurl" TEXT NOT NULL;
