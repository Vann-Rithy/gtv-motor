-- Add exchange rate columns to services table (without default exchange rate)
-- This script adds exchange_rate and total_khr columns where exchange_rate must be input by user

-- Add exchange rate columns to services table
ALTER TABLE `services`
ADD COLUMN `exchange_rate` decimal(8,2) DEFAULT NULL COMMENT 'Exchange rate USD to KHR (user input required)' AFTER `service_cost`,
ADD COLUMN `total_khr` decimal(12,2) DEFAULT NULL COMMENT 'Total amount in KHR' AFTER `exchange_rate`;

-- Add index for better performance
ALTER TABLE `services`
ADD INDEX `idx_exchange_rate` (`exchange_rate`),
ADD INDEX `idx_total_khr` (`total_khr`);

-- Verify the changes
-- You can run this query to confirm the columns are added:
-- DESCRIBE `services`;
