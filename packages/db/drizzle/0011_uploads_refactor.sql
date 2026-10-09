ALTER TABLE `uploads` ADD `purpose` varchar(20) DEFAULT 'service_order' NOT NULL;--> statement-breakpoint
ALTER TABLE `uploads` MODIFY COLUMN `company_id` varchar(25);--> statement-breakpoint
ALTER TABLE `uploads` MODIFY COLUMN `employee_id` varchar(25);--> statement-breakpoint
ALTER TABLE `model_images` ADD `upload_id` varchar(25);--> statement-breakpoint
ALTER TABLE `model_images` ADD CONSTRAINT `model_images_upload_id_uploads_id_fk` FOREIGN KEY (`upload_id`) REFERENCES `uploads`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_images` DROP COLUMN `original_url`;--> statement-breakpoint
ALTER TABLE `model_images` DROP COLUMN `r2_key`;--> statement-breakpoint
ALTER TABLE `service_order_images` DROP COLUMN `image_url`;--> statement-breakpoint
ALTER TABLE `service_order_images` DROP COLUMN `file_name`;--> statement-breakpoint
ALTER TABLE `service_order_images` DROP COLUMN `content_type`;--> statement-breakpoint
ALTER TABLE `service_order_images` DROP COLUMN `size_in_bytes`;
