ALTER TABLE `clients` MODIFY COLUMN `user_id` varchar(25);--> statement-breakpoint
ALTER TABLE `model_makers` MODIFY COLUMN `url` varchar(255) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `clients` ADD `email` varchar(255);--> statement-breakpoint
ALTER TABLE `clients` ADD `address` varchar(255);--> statement-breakpoint
ALTER TABLE `clients` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `clients` ADD `province` varchar(100);--> statement-breakpoint
ALTER TABLE `model_makers` ADD `maker_kind` enum('phone','watch') DEFAULT 'phone' NOT NULL;