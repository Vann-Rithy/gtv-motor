-- Remove ALL duplicate constraints from vehicles table
-- This allows users to upload vehicles with the same plate/VIN multiple times

-- Remove ALL unique constraints on vehicles
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_customer_plate`;
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_plate_number`;
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_customer_vin`;
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_vin_number`;
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_vehicle`;
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_plate`;
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_vin`;

-- Add regular indexes for better search performance (non-unique)
ALTER TABLE `vehicles` ADD INDEX `idx_plate_number` (`plate_number`);
ALTER TABLE `vehicles` ADD INDEX `idx_vin_number` (`vin_number`);
ALTER TABLE `vehicles` ADD INDEX `idx_customer_plate` (`customer_id`, `plate_number`);
ALTER TABLE `vehicles` ADD INDEX `idx_customer_vin` (`customer_id`, `vin_number`);

-- Show current indexes to verify
SHOW INDEX FROM `vehicles`;
