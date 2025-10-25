-- Remove ALL phone number unique constraints
-- This allows users to upload customers with the same phone number multiple times

-- Remove ALL unique constraints on customers
ALTER TABLE `customers` DROP INDEX IF EXISTS `unique_phone`;
ALTER TABLE `customers` DROP INDEX IF EXISTS `unique_email`;
ALTER TABLE `customers` DROP INDEX IF EXISTS `unique_customer`;
ALTER TABLE `customers` DROP INDEX IF EXISTS `unique_customer_phone`;

-- Add regular indexes for better search performance (non-unique)
ALTER TABLE `customers` ADD INDEX `idx_phone` (`phone`);
ALTER TABLE `customers` ADD INDEX `idx_email` (`email`);

-- Show current indexes to verify
SHOW INDEX FROM `customers`;
