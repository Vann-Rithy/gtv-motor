-- Fix exchange rate columns to properly handle 0 values
-- This script ensures that 0 values are stored instead of being converted to NULL

-- Update existing NULL values to 0 for exchange_rate
UPDATE `services` 
SET `exchange_rate` = 0 
WHERE `exchange_rate` IS NULL;

-- Update existing NULL values to 0 for total_khr  
UPDATE `services` 
SET `total_khr` = 0 
WHERE `total_khr` IS NULL;

-- Modify the column definition to have DEFAULT 0 instead of DEFAULT NULL
ALTER TABLE `services` 
MODIFY COLUMN `exchange_rate` decimal(8,2) DEFAULT 0.00 COMMENT 'Exchange rate USD to KHR (user input required)',
MODIFY COLUMN `total_khr` decimal(12,2) DEFAULT 0.00 COMMENT 'Total amount in KHR';

-- Verify the changes
-- You can run this query to confirm the columns are updated:
-- DESCRIBE `services`;
