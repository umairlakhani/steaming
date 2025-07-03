/*
  Warnings:

  - Added the required column `Title` to the `LiveStreaming` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `LiveStreaming` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LiveStreaming" ADD COLUMN     "Title" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "thumbnail" TEXT NOT NULL DEFAULT '';
