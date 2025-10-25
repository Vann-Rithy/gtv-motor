-- Fix VIN number duplicates before applying constraints
-- This script handles existing duplicate VIN numbers for the same customer

-- Step 1: Check for duplicate VIN numbers per customer
SELECT 
    customer_id, 
    vin_number, 
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(id) as vehicle_ids
FROM vehicles 
WHERE vin_number IS NOT NULL AND vin_number != ''
GROUP BY customer_id, vin_number 
HAVING COUNT(*) > 1;

-- Step 2: Update duplicate VIN numbers to make them unique
-- For vehicles with duplicate VIN numbers for the same customer, 
-- we'll append the vehicle ID to make them unique
UPDATE vehicles v1
JOIN (
    SELECT 
        customer_id, 
        vin_number, 
        MIN(id) as keep_id,
        GROUP_CONCAT(id ORDER BY id) as all_ids
    FROM vehicles 
    WHERE vin_number IS NOT NULL AND vin_number != ''
    GROUP BY customer_id, vin_number 
    HAVING COUNT(*) > 1
) duplicates ON v1.customer_id = duplicates.customer_id 
    AND v1.vin_number = duplicates.vin_number
    AND v1.id != duplicates.keep_id
SET v1.vin_number = CONCAT(v1.vin_number, '-', v1.id);

-- Step 3: Now we can safely apply the constraints
-- Remove existing unique constraints
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_plate_number`;
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_vin_number`;

-- Add composite unique constraints
ALTER TABLE `vehicles` ADD UNIQUE KEY `unique_customer_plate` (`customer_id`, `plate_number`);
ALTER TABLE `vehicles` ADD UNIQUE KEY `unique_customer_vin` (`customer_id`, `vin_number`);

-- Keep performance indexes
ALTER TABLE `vehicles` ADD INDEX IF NOT EXISTS `idx_vehicles_plate_number` (`plate_number`);
ALTER TABLE `vehicles` ADD INDEX IF NOT EXISTS `idx_vehicles_vin_number` (`vin_number`);
