-- Rollback script for vehicle_models relationships
-- This script removes all foreign key constraints and columns added for vehicle_models integration
-- WARNING: This will remove all vehicle model relationships and data

-- Step 1: Drop foreign key constraints
ALTER TABLE `vehicles` DROP FOREIGN KEY IF EXISTS `fk_vehicles_vehicle_model`;
ALTER TABLE `services` DROP FOREIGN KEY IF EXISTS `fk_services_vehicle_model`;
ALTER TABLE `bookings` DROP FOREIGN KEY IF EXISTS `fk_bookings_vehicle_model`;
ALTER TABLE `inventory_items` DROP FOREIGN KEY IF EXISTS `fk_inventory_vehicle_model`;
ALTER TABLE `warranty_services` DROP FOREIGN KEY IF EXISTS `fk_warranty_services_vehicle_model`;

-- Step 2: Drop indexes
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `idx_vehicle_model_id`;
ALTER TABLE `services` DROP INDEX IF EXISTS `idx_services_vehicle_model_id`;
ALTER TABLE `bookings` DROP INDEX IF EXISTS `idx_bookings_vehicle_model_id`;
ALTER TABLE `inventory_items` DROP INDEX IF EXISTS `idx_inventory_vehicle_model_id`;
ALTER TABLE `warranty_services` DROP INDEX IF EXISTS `idx_warranty_services_vehicle_model_id`;

-- Step 3: Drop columns
ALTER TABLE `vehicles` DROP COLUMN IF EXISTS `vehicle_model_id`;
ALTER TABLE `services` DROP COLUMN IF EXISTS `vehicle_model_id`;
ALTER TABLE `bookings` DROP COLUMN IF EXISTS `vehicle_model_id`;
ALTER TABLE `inventory_items` DROP COLUMN IF EXISTS `vehicle_model_id`;
ALTER TABLE `warranty_services` DROP COLUMN IF EXISTS `vehicle_model_id`;

-- Step 4: Drop the vehicle_models table (optional - uncomment if you want to remove the entire table)
-- DROP TABLE IF EXISTS `vehicle_models`;

-- Step 5: Verify the rollback
SHOW CREATE TABLE `vehicles`;
SHOW CREATE TABLE `services`;
SHOW CREATE TABLE `bookings`;
SHOW CREATE TABLE `inventory_items`;
SHOW CREATE TABLE `warranty_services`;

-- Step 6: Check if vehicle_models table still exists
SHOW TABLES LIKE 'vehicle_models';

-- Step 7: Show current table structures
DESCRIBE `vehicles`;
DESCRIBE `services`;
DESCRIBE `bookings`;
DESCRIBE `inventory_items`;
DESCRIBE `warranty_services`;
