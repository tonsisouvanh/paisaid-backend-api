/*
  Warnings:

  - You are about to drop the column `content` on the `banners` table. All the data in the column will be lost.
  - Added the required column `headline` to the `banners` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subline` to the `banners` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "banners" DROP COLUMN "content",
ADD COLUMN     "altText" TEXT,
ADD COLUMN     "headline" TEXT NOT NULL,
ADD COLUMN     "imagePublicId" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "subline" TEXT NOT NULL;
