-- Update database relationships to use vehicle_models table
-- This script adds foreign key relationships and updates existing data

-- Step 1: Add vehicle_model_id column to vehicles table
ALTER TABLE `vehicles`
ADD COLUMN `vehicle_model_id` int(11) DEFAULT NULL AFTER `model`,
ADD INDEX `idx_vehicle_model_id` (`vehicle_model_id`);

-- Step 2: Update existing vehicles to reference vehicle_models
-- Map existing model names to vehicle_model_id
UPDATE `vehicles` v
JOIN `vehicle_models` vm ON v.model = vm.name
SET v.vehicle_model_id = vm.id
WHERE v.model IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR');

-- Step 3: Add foreign key constraint
ALTER TABLE `vehicles`
ADD CONSTRAINT `fk_vehicles_vehicle_model`
FOREIGN KEY (`vehicle_model_id`) REFERENCES `vehicle_models`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 4: Update services table to include vehicle model information
-- Add columns for better vehicle model tracking
ALTER TABLE `services`
ADD COLUMN `vehicle_model_id` int(11) DEFAULT NULL AFTER `vehicle_id`,
ADD INDEX `idx_services_vehicle_model_id` (`vehicle_model_id`);

-- Step 5: Update services to reference vehicle models through vehicles
UPDATE `services` s
JOIN `vehicles` v ON s.vehicle_id = v.id
JOIN `vehicle_models` vm ON v.vehicle_model_id = vm.id
SET s.vehicle_model_id = vm.id;

-- Step 6: Add foreign key constraint for services
ALTER TABLE `services`
ADD CONSTRAINT `fk_services_vehicle_model`
FOREIGN KEY (`vehicle_model_id`) REFERENCES `vehicle_models`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 7: Update bookings table structure
-- Add vehicle_model_id to bookings for better tracking
ALTER TABLE `bookings`
ADD COLUMN `vehicle_model_id` int(11) DEFAULT NULL AFTER `service_type_id`,
ADD INDEX `idx_bookings_vehicle_model_id` (`vehicle_model_id`);

-- Step 8: Update existing bookings to extract and reference vehicle models
-- This is more complex as vehicle_data is JSON, so we'll extract the model name
UPDATE `bookings` b
JOIN `vehicle_models` vm ON JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.model')) = vm.name
SET b.vehicle_model_id = vm.id
WHERE JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.model')) IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR');

-- Step 9: Add foreign key constraint for bookings
ALTER TABLE `bookings`
ADD CONSTRAINT `fk_bookings_vehicle_model`
FOREIGN KEY (`vehicle_model_id`) REFERENCES `vehicle_models`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 10: Update inventory_items to reference vehicle models
-- Add vehicle_model_id column
ALTER TABLE `inventory_items`
ADD COLUMN `vehicle_model_id` int(11) DEFAULT NULL AFTER `category_id`,
ADD INDEX `idx_inventory_vehicle_model_id` (`vehicle_model_id`);

-- Step 11: Update inventory items that reference specific models
UPDATE `inventory_items` i
JOIN `vehicle_models` vm ON (
  (i.name LIKE CONCAT('%', vm.name, '%')) OR
  (i.sku LIKE CONCAT('%', vm.name, '%'))
)
SET i.vehicle_model_id = vm.id
WHERE i.name LIKE '%SOBEN%' OR i.name LIKE '%KAIN%' OR i.name LIKE '%KOUPREY%'
   OR i.name LIKE '%KRUSAR%' OR i.name LIKE '%KESSOR%'
   OR i.sku LIKE '%SOB%' OR i.sku LIKE '%KAI%' OR i.sku LIKE '%KOU%'
   OR i.sku LIKE '%KRU%' OR i.sku LIKE '%KES%';

-- Step 12: Add foreign key constraint for inventory
ALTER TABLE `inventory_items`
ADD CONSTRAINT `fk_inventory_vehicle_model`
FOREIGN KEY (`vehicle_model_id`) REFERENCES `vehicle_models`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 13: Update warranty_services to reference vehicle models
-- Add vehicle_model_id column
ALTER TABLE `warranty_services`
ADD COLUMN `vehicle_model_id` int(11) DEFAULT NULL AFTER `service_id`,
ADD INDEX `idx_warranty_services_vehicle_model_id` (`vehicle_model_id`);

-- Step 14: Update warranty services based on service_type names
UPDATE `warranty_services` ws
JOIN `vehicle_models` vm ON ws.service_type LIKE CONCAT('%', vm.name, '%')
SET ws.vehicle_model_id = vm.id
WHERE ws.service_type LIKE '%SOBEN%' OR ws.service_type LIKE '%KAIN%'
   OR ws.service_type LIKE '%KOUPREY%' OR ws.service_type LIKE '%KRUSAR%'
   OR ws.service_type LIKE '%KESSOR%';

-- Step 15: Add foreign key constraint for warranty services
ALTER TABLE `warranty_services`
ADD CONSTRAINT `fk_warranty_services_vehicle_model`
FOREIGN KEY (`vehicle_model_id`) REFERENCES `vehicle_models`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 16: Verify the relationships
SELECT
  'vehicles' as table_name,
  COUNT(*) as total_records,
  COUNT(vehicle_model_id) as with_model_id,
  COUNT(*) - COUNT(vehicle_model_id) as without_model_id
FROM vehicles
UNION ALL
SELECT
  'services' as table_name,
  COUNT(*) as total_records,
  COUNT(vehicle_model_id) as with_model_id,
  COUNT(*) - COUNT(vehicle_model_id) as without_model_id
FROM services
UNION ALL
SELECT
  'bookings' as table_name,
  COUNT(*) as total_records,
  COUNT(vehicle_model_id) as with_model_id,
  COUNT(*) - COUNT(vehicle_model_id) as without_model_id
FROM bookings
UNION ALL
SELECT
  'inventory_items' as table_name,
  COUNT(*) as total_records,
  COUNT(vehicle_model_id) as with_model_id,
  COUNT(*) - COUNT(vehicle_model_id) as without_model_id
FROM inventory_items
UNION ALL
SELECT
  'warranty_services' as table_name,
  COUNT(*) as total_records,
  COUNT(vehicle_model_id) as with_model_id,
  COUNT(*) - COUNT(vehicle_model_id) as without_model_id
FROM warranty_services;

-- Step 17: Show sample of updated relationships
SELECT
  v.id as vehicle_id,
  v.plate_number,
  v.model as old_model_name,
  vm.name as new_model_name,
  vm.category,
  vm.base_price
FROM vehicles v
LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
WHERE v.vehicle_model_id IS NOT NULL
LIMIT 10;
