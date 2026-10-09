ALTER TABLE `clients` RENAME COLUMN `cpf` TO `dni`;--> statement-breakpoint
ALTER TABLE `companies` RENAME COLUMN `cnpj` TO `cuit`;--> statement-breakpoint
ALTER TABLE `employees` RENAME COLUMN `cpf` TO `dni`;--> statement-breakpoint
ALTER TABLE `clients` DROP INDEX `clients_cpf_unique`;--> statement-breakpoint
ALTER TABLE `companies` DROP INDEX `companies_cnpj_unique`;--> statement-breakpoint
ALTER TABLE `employees` DROP INDEX `employees_cpf_unique`;--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `cuit` varchar(11) NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_dni_unique` UNIQUE(`dni`);--> statement-breakpoint
ALTER TABLE `companies` ADD CONSTRAINT `companies_cuit_unique` UNIQUE(`cuit`);--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_dni_unique` UNIQUE(`dni`);