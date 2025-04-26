-- CreateTable
CREATE TABLE "LandingPageBanner" (
    "id" SERIAL NOT NULL,
    "content" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingPageBanner_pkey" PRIMARY KEY ("id")
);
