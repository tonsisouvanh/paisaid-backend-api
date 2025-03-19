-- DropForeignKey
ALTER TABLE `photos` DROP FOREIGN KEY `photos_post_id_fkey`;

-- AddForeignKey
ALTER TABLE `photos` ADD CONSTRAINT `photos_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
