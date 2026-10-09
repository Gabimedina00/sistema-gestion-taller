ALTER TABLE `service_orders` ADD `reference_number` varchar(100);--> statement-breakpoint
ALTER TABLE `service_orders` ADD `serial_number` varchar(100);--> statement-breakpoint
ALTER TABLE `service_orders` ADD `movement_type` enum('quartz','automatic','manual','smartwatch');--> statement-breakpoint
ALTER TABLE `service_orders` ADD `caliber` varchar(100);--> statement-breakpoint
ALTER TABLE `service_orders` ADD `requested_services` json;--> statement-breakpoint
ALTER TABLE `service_orders` ADD `items_received` json;--> statement-breakpoint
ALTER TABLE `service_orders` ADD `intake_condition` text;--> statement-breakpoint
ALTER TABLE `service_orders` ADD `estimated_cost` decimal(12,2);--> statement-breakpoint
ALTER TABLE `service_orders` ADD `estimated_delivery_date` date;--> statement-breakpoint
ALTER TABLE `service_orders` ADD `warranty_days` int;