-- Remove exchange rate columns from services table
-- This script removes the exchange_rate and total_khr columns that were automatically added

-- Drop indexes first (required before dropping columns)
ALTER TABLE `services`
DROP INDEX `idx_exchange_rate`,
DROP INDEX `idx_total_khr`;

-- Remove the exchange rate columns
ALTER TABLE `services`
DROP COLUMN `exchange_rate`,
DROP COLUMN `total_khr`;

-- Verify the changes
-- You can run this query to confirm the columns are removed:
-- DESCRIBE `services`;
