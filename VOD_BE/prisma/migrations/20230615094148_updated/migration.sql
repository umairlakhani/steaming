/*
  Warnings:

  - Added the required column `userId` to the `AdSpeed` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AdSpeed" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "AdSpeed" ADD CONSTRAINT "AdSpeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
