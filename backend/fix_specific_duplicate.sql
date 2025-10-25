-- Fix specific duplicate VIN issue
-- This script handles the specific duplicate VIN 'LYUI8679THY567t' for customer 44

-- Step 1: Check what vehicles have this duplicate VIN
SELECT 
    id, 
    customer_id, 
    plate_number, 
    vin_number, 
    created_at
FROM vehicles 
WHERE customer_id = 44 AND vin_number = 'LYUI8679THY567t'
ORDER BY id;

-- Step 2: Update the duplicate VIN to make it unique
-- Keep the first vehicle (lowest ID) and modify the others
UPDATE vehicles 
SET vin_number = CONCAT(vin_number, '-', id)
WHERE customer_id = 44 
  AND vin_number = 'LYUI8679THY567t' 
  AND id > (SELECT MIN(id) FROM vehicles WHERE customer_id = 44 AND vin_number = 'LYUI8679THY567t');

-- Step 3: Verify the fix
SELECT 
    id, 
    customer_id, 
    plate_number, 
    vin_number
FROM vehicles 
WHERE customer_id = 44 AND vin_number LIKE 'LYUI8679THY567t%'
ORDER BY id;

-- Step 4: Now apply the constraints
-- Remove existing unique constraints
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_plate_number`;
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_vin_number`;

-- Add composite unique constraints
ALTER TABLE `vehicles` ADD UNIQUE KEY `unique_customer_plate` (`customer_id`, `plate_number`);
ALTER TABLE `vehicles` ADD UNIQUE KEY `unique_customer_vin` (`customer_id`, `vin_number`);

-- Keep performance indexes
ALTER TABLE `vehicles` ADD INDEX IF NOT EXISTS `idx_vehicles_plate_number` (`plate_number`);
ALTER TABLE `vehicles` ADD INDEX IF NOT EXISTS `idx_vehicles_vin_number` (`vin_number`);
