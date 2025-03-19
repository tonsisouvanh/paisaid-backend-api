/*
  Warnings:

  - Added the required column `public_id` to the `photos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `photos` ADD COLUMN `public_id` VARCHAR(191) NOT NULL;
