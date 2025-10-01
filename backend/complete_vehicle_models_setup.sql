-- Complete Vehicle Models Setup Script
-- This script creates the vehicle_models table and sets up all relationships
-- Run this script to set up the complete vehicle models system

-- Step 1: Create vehicle_models table with all enhanced columns
CREATE TABLE IF NOT EXISTS `vehicle_models` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(50) DEFAULT 'Motorcycle',
  `base_price` decimal(10,2) DEFAULT 0.00,
  `estimated_duration` int(11) DEFAULT 60 COMMENT 'Service duration in minutes',
  `warranty_km_limit` int(11) DEFAULT 15000 COMMENT 'Default warranty kilometers',
  `warranty_max_services` int(11) DEFAULT 2 COMMENT 'Maximum warranty services',
  `engine_type` varchar(50) DEFAULT '4-Stroke',
  `cc_displacement` int(11) DEFAULT NULL COMMENT 'Engine displacement in CC',
  `fuel_type` varchar(20) DEFAULT 'Gasoline',
  `transmission` varchar(20) DEFAULT 'Manual',
  `color_options` json DEFAULT NULL COMMENT 'Available colors as JSON array',
  `year_range` varchar(20) DEFAULT NULL COMMENT 'Model year range (e.g., 2020-2025)',
  `specifications` json DEFAULT NULL COMMENT 'Technical specifications as JSON',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Step 2: Insert default vehicle models with complete information
INSERT INTO `vehicle_models` (
  `name`, `description`, `category`, `base_price`, `estimated_duration`,
  `warranty_km_limit`, `warranty_max_services`, `engine_type`, `cc_displacement`,
  `fuel_type`, `transmission`, `color_options`, `year_range`, `specifications`, `is_active`
) VALUES
('SOBEN', 'SOBEN motorcycle model', 'Motorcycle', 1200.00, 45, 15000, 2, '4-Stroke', 150, 'Gasoline', 'Manual',
 JSON_ARRAY('Black', 'White', 'Red', 'Blue'), '2020-2025',
 JSON_OBJECT('weight', '120kg', 'max_speed', '120 km/h', 'fuel_capacity', '12L', 'brakes', 'Disc', 'suspension', 'Telescopic'), 1),

('KAIN', 'KAIN motorcycle model', 'Motorcycle', 950.00, 40, 12000, 2, '4-Stroke', 125, 'Gasoline', 'Manual',
 JSON_ARRAY('Black', 'White', 'Silver'), '2020-2025',
 JSON_OBJECT('weight', '110kg', 'max_speed', '100 km/h', 'fuel_capacity', '10L', 'brakes', 'Disc', 'suspension', 'Telescopic'), 1),

('KOUPREY', 'KOUPREY heavy-duty model', 'Heavy Duty', 2500.00, 90, 20000, 3, '4-Stroke', 250, 'Gasoline', 'Manual',
 JSON_ARRAY('Black', 'White', 'Green'), '2020-2025',
 JSON_OBJECT('weight', '180kg', 'max_speed', '140 km/h', 'fuel_capacity', '18L', 'brakes', 'Disc', 'suspension', 'Telescopic'), 1),

('KRUSAR', 'KRUSAR family model', 'Family', 1800.00, 60, 15000, 2, '4-Stroke', 200, 'Gasoline', 'Manual',
 JSON_ARRAY('Black', 'White', 'Blue', 'Red'), '2020-2025',
 JSON_OBJECT('weight', '150kg', 'max_speed', '110 km/h', 'fuel_capacity', '15L', 'brakes', 'Disc', 'suspension', 'Telescopic'), 1),

('KESSOR', 'KESSOR luxury model', 'Luxury', 3200.00, 75, 18000, 3, '4-Stroke', 300, 'Gasoline', 'Manual',
 JSON_ARRAY('Black', 'White', 'Gold', 'Silver'), '2020-2025',
 JSON_OBJECT('weight', '160kg', 'max_speed', '150 km/h', 'fuel_capacity', '16L', 'brakes', 'Disc', 'suspension', 'Telescopic'), 1)

ON DUPLICATE KEY UPDATE
  `description` = VALUES(`description`),
  `category` = VALUES(`category`),
  `base_price` = VALUES(`base_price`),
  `estimated_duration` = VALUES(`estimated_duration`),
  `warranty_km_limit` = VALUES(`warranty_km_limit`),
  `warranty_max_services` = VALUES(`warranty_max_services`),
  `engine_type` = VALUES(`engine_type`),
  `cc_displacement` = VALUES(`cc_displacement`),
  `fuel_type` = VALUES(`fuel_type`),
  `transmission` = VALUES(`transmission`),
  `color_options` = VALUES(`color_options`),
  `year_range` = VALUES(`year_range`),
  `specifications` = VALUES(`specifications`),
  `is_active` = VALUES(`is_active`),
  `updated_at` = current_timestamp();

-- Step 3: Add vehicle_model_id column to vehicles table
ALTER TABLE `vehicles`
ADD COLUMN IF NOT EXISTS `vehicle_model_id` int(11) DEFAULT NULL AFTER `model`,
ADD INDEX IF NOT EXISTS `idx_vehicle_model_id` (`vehicle_model_id`);

-- Step 4: Update existing vehicles to reference vehicle_models
UPDATE `vehicles` v
JOIN `vehicle_models` vm ON v.model = vm.name
SET v.vehicle_model_id = vm.id
WHERE v.model IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR');

-- Step 5: Add foreign key constraint for vehicles
ALTER TABLE `vehicles`
ADD CONSTRAINT IF NOT EXISTS `fk_vehicles_vehicle_model`
FOREIGN KEY (`vehicle_model_id`) REFERENCES `vehicle_models`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 6: Add vehicle_model_id column to services table
ALTER TABLE `services`
ADD COLUMN IF NOT EXISTS `vehicle_model_id` int(11) DEFAULT NULL AFTER `vehicle_id`,
ADD INDEX IF NOT EXISTS `idx_services_vehicle_model_id` (`vehicle_model_id`);

-- Step 7: Update services to reference vehicle models through vehicles
UPDATE `services` s
JOIN `vehicles` v ON s.vehicle_id = v.id
JOIN `vehicle_models` vm ON v.vehicle_model_id = vm.id
SET s.vehicle_model_id = vm.id;

-- Step 8: Add foreign key constraint for services
ALTER TABLE `services`
ADD CONSTRAINT IF NOT EXISTS `fk_services_vehicle_model`
FOREIGN KEY (`vehicle_model_id`) REFERENCES `vehicle_models`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 9: Add vehicle_model_id column to bookings table
ALTER TABLE `bookings`
ADD COLUMN IF NOT EXISTS `vehicle_model_id` int(11) DEFAULT NULL AFTER `service_type_id`,
ADD INDEX IF NOT EXISTS `idx_bookings_vehicle_model_id` (`vehicle_model_id`);

-- Step 10: Update existing bookings to extract and reference vehicle models
UPDATE `bookings` b
JOIN `vehicle_models` vm ON JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.model')) = vm.name
SET b.vehicle_model_id = vm.id
WHERE JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.model')) IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR');

-- Step 11: Add foreign key constraint for bookings
ALTER TABLE `bookings`
ADD CONSTRAINT IF NOT EXISTS `fk_bookings_vehicle_model`
FOREIGN KEY (`vehicle_model_id`) REFERENCES `vehicle_models`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 12: Add vehicle_model_id column to inventory_items table
ALTER TABLE `inventory_items`
ADD COLUMN IF NOT EXISTS `vehicle_model_id` int(11) DEFAULT NULL AFTER `category_id`,
ADD INDEX IF NOT EXISTS `idx_inventory_vehicle_model_id` (`vehicle_model_id`);

-- Step 13: Update inventory items that reference specific models
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

-- Step 14: Add foreign key constraint for inventory
ALTER TABLE `inventory_items`
ADD CONSTRAINT IF NOT EXISTS `fk_inventory_vehicle_model`
FOREIGN KEY (`vehicle_model_id`) REFERENCES `vehicle_models`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 15: Add vehicle_model_id column to warranty_services table
ALTER TABLE `warranty_services`
ADD COLUMN IF NOT EXISTS `vehicle_model_id` int(11) DEFAULT NULL AFTER `service_id`,
ADD INDEX IF NOT EXISTS `idx_warranty_services_vehicle_model_id` (`vehicle_model_id`);

-- Step 16: Update warranty services based on service_type names
UPDATE `warranty_services` ws
JOIN `vehicle_models` vm ON ws.service_type LIKE CONCAT('%', vm.name, '%')
SET ws.vehicle_model_id = vm.id
WHERE ws.service_type LIKE '%SOBEN%' OR ws.service_type LIKE '%KAIN%'
   OR ws.service_type LIKE '%KOUPREY%' OR ws.service_type LIKE '%KRUSAR%'
   OR ws.service_type LIKE '%KESSOR%';

-- Step 17: Add foreign key constraint for warranty services
ALTER TABLE `warranty_services`
ADD CONSTRAINT IF NOT EXISTS `fk_warranty_services_vehicle_model`
FOREIGN KEY (`vehicle_model_id`) REFERENCES `vehicle_models`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 18: Verify the setup
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

-- Step 19: Show sample of updated relationships
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
