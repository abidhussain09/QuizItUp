/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `imagePublicId` on the `Question` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Question" DROP COLUMN "deletedAt",
DROP COLUMN "imagePublicId";
