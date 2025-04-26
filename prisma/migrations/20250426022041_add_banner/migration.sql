/*
  Warnings:

  - You are about to drop the `LandingPageBanner` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "LandingPageBanner";

-- CreateTable
CREATE TABLE "banners" (
    "id" SERIAL NOT NULL,
    "content" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);
