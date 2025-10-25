-- Fix plate number and VIN number uniqueness constraints
-- This script removes overly restrictive unique constraints and replaces them with
-- composite constraints that allow same plate/VIN numbers for different customers

-- Step 1: Remove the existing unique constraint on plate_number
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_plate_number`;

-- Step 2: Remove the existing unique constraint on vin_number
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_vin_number`;

-- Step 3: Add composite unique constraints that allow same plate/VIN for different customers
-- This ensures that the same customer cannot have duplicate plate numbers or VINs, 
-- but different customers can have the same plate numbers or VINs
ALTER TABLE `vehicles` ADD UNIQUE KEY `unique_customer_plate` (`customer_id`, `plate_number`);
ALTER TABLE `vehicles` ADD UNIQUE KEY `unique_customer_vin` (`customer_id`, `vin_number`);

-- Step 4: Keep regular indexes for performance
ALTER TABLE `vehicles` ADD INDEX IF NOT EXISTS `idx_vehicles_plate_number` (`plate_number`);
ALTER TABLE `vehicles` ADD INDEX IF NOT EXISTS `idx_vehicles_vin_number` (`vin_number`);
