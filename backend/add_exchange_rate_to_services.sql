-- Add exchange rate columns to services table
ALTER TABLE `services`
ADD COLUMN `exchange_rate` decimal(8,2) DEFAULT 4050.00 COMMENT 'Exchange rate USD to KHR' AFTER `service_cost`,
ADD COLUMN `total_khr` decimal(12,2) DEFAULT NULL COMMENT 'Total amount in KHR' AFTER `exchange_rate`;

-- Add index for better performance
ALTER TABLE `services`
ADD INDEX `idx_exchange_rate` (`exchange_rate`),
ADD INDEX `idx_total_khr` (`total_khr`);
