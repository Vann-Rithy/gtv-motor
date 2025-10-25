-- Check current column definitions and fix them
-- This script checks the current state and fixes the exchange rate columns

-- First, let's see what columns exist and their definitions
-- DESCRIBE services;

-- If exchange_rate and total_khr already exist, let's fix their definitions
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
