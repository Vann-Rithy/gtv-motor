-- Safe fix for VIN number duplicates and constraints
-- This script handles existing duplicate VIN numbers before applying constraints

-- Step 1: First, let's see what duplicates exist
SELECT 
    'DUPLICATE VIN CHECK' as info,
    customer_id, 
    vin_number, 
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(id ORDER BY id) as vehicle_ids
FROM vehicles 
WHERE vin_number IS NOT NULL AND vin_number != ''
GROUP BY customer_id, vin_number 
HAVING COUNT(*) > 1;

-- Step 2: Check for duplicate plate numbers per customer
SELECT 
    'DUPLICATE PLATE CHECK' as info,
    customer_id, 
    plate_number, 
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(id ORDER BY id) as vehicle_ids
FROM vehicles 
GROUP BY customer_id, plate_number 
HAVING COUNT(*) > 1;

-- Step 3: If duplicates exist, we have a few options:
-- Option A: Set duplicate VINs to NULL (safest)
-- Option B: Append vehicle ID to make them unique
-- Option C: Keep only the first vehicle and delete others

-- For now, let's use Option A (set duplicates to NULL) as it's the safest
-- This preserves the vehicle records but removes the conflicting VIN numbers

-- Update duplicate VIN numbers to NULL (keeping the first occurrence)
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
SET v1.vin_number = NULL;

-- Update duplicate plate numbers to NULL (keeping the first occurrence)
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

-- Step 4: Now we can safely apply the constraints
-- Remove existing unique constraints
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_plate_number`;
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_vin_number`;

-- Add composite unique constraints
ALTER TABLE `vehicles` ADD UNIQUE KEY `unique_customer_plate` (`customer_id`, `plate_number`);
ALTER TABLE `vehicles` ADD UNIQUE KEY `unique_customer_vin` (`customer_id`, `vin_number`);

-- Keep performance indexes
ALTER TABLE `vehicles` ADD INDEX IF NOT EXISTS `idx_vehicles_plate_number` (`plate_number`);
ALTER TABLE `vehicles` ADD INDEX IF NOT EXISTS `idx_vehicles_vin_number` (`vin_number`);
