-- Safe constraint fix - handles existing constraints
-- This script safely removes and recreates constraints

-- Step 1: Remove existing constraints if they exist
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_plate_number`;
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_vin_number`;
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_customer_plate`;
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_customer_vin`;

-- Step 2: Fix any remaining duplicates before applying constraints
-- Fix duplicate VIN numbers for the same customer
UPDATE vehicles v1
JOIN (
    SELECT 
        customer_id, 
        vin_number, 
        MIN(id) as keep_id
    FROM vehicles 
    WHERE vin_number IS NOT NULL AND vin_number != ''
    GROUP BY customer_id, vin_number 
    HAVING COUNT(*) > 1
) duplicates ON v1.customer_id = duplicates.customer_id 
    AND v1.vin_number = duplicates.vin_number
    AND v1.id != duplicates.keep_id
SET v1.vin_number = CONCAT(v1.vin_number, '-', v1.id);

-- Fix duplicate plate numbers for the same customer
UPDATE vehicles v1
JOIN (
    SELECT 
        customer_id, 
        plate_number, 
        MIN(id) as keep_id
    FROM vehicles 
    GROUP BY customer_id, plate_number 
    HAVING COUNT(*) > 1
) duplicates ON v1.customer_id = duplicates.customer_id 
    AND v1.plate_number = duplicates.plate_number
    AND v1.id != duplicates.keep_id
SET v1.plate_number = CONCAT(v1.plate_number, '-', v1.id);

-- Step 3: Now safely add the constraints
ALTER TABLE `vehicles` ADD UNIQUE KEY `unique_customer_plate` (`customer_id`, `plate_number`);
ALTER TABLE `vehicles` ADD UNIQUE KEY `unique_customer_vin` (`customer_id`, `vin_number`);

-- Step 4: Add performance indexes
ALTER TABLE `vehicles` ADD INDEX IF NOT EXISTS `idx_vehicles_plate_number` (`plate_number`);
ALTER TABLE `vehicles` ADD INDEX IF NOT EXISTS `idx_vehicles_vin_number` (`vin_number`);
