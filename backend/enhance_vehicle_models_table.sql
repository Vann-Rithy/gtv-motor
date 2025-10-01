-- Enhance vehicle_models table with comprehensive information
-- This script adds additional columns to make vehicle models more complete

-- Add new columns to vehicle_models table
ALTER TABLE `vehicle_models`
ADD COLUMN `category` varchar(50) DEFAULT 'Motorcycle' AFTER `description`,
ADD COLUMN `base_price` decimal(10,2) DEFAULT 0.00 AFTER `category`,
ADD COLUMN `estimated_duration` int(11) DEFAULT 60 COMMENT 'Service duration in minutes' AFTER `base_price`,
ADD COLUMN `warranty_km_limit` int(11) DEFAULT 15000 COMMENT 'Default warranty kilometers' AFTER `estimated_duration`,
ADD COLUMN `warranty_max_services` int(11) DEFAULT 2 COMMENT 'Maximum warranty services' AFTER `warranty_km_limit`,
ADD COLUMN `engine_type` varchar(50) DEFAULT '4-Stroke' AFTER `warranty_max_services`,
ADD COLUMN `cc_displacement` int(11) DEFAULT NULL COMMENT 'Engine displacement in CC' AFTER `engine_type`,
ADD COLUMN `fuel_type` varchar(20) DEFAULT 'Gasoline' AFTER `cc_displacement`,
ADD COLUMN `transmission` varchar(20) DEFAULT 'Manual' AFTER `fuel_type`,
ADD COLUMN `color_options` json DEFAULT NULL COMMENT 'Available colors as JSON array' AFTER `transmission`,
ADD COLUMN `year_range` varchar(20) DEFAULT NULL COMMENT 'Model year range (e.g., 2020-2025)' AFTER `color_options`,
ADD COLUMN `specifications` json DEFAULT NULL COMMENT 'Technical specifications as JSON' AFTER `year_range`;

-- Update existing vehicle models with enhanced information
UPDATE `vehicle_models` SET
  `category` = 'Motorcycle',
  `base_price` = 1200.00,
  `estimated_duration` = 45,
  `warranty_km_limit` = 15000,
  `warranty_max_services` = 2,
  `engine_type` = '4-Stroke',
  `cc_displacement` = 150,
  `fuel_type` = 'Gasoline',
  `transmission` = 'Manual',
  `color_options` = JSON_ARRAY('Black', 'White', 'Red', 'Blue'),
  `year_range` = '2020-2025',
  `specifications` = JSON_OBJECT(
    'weight', '120kg',
    'max_speed', '120 km/h',
    'fuel_capacity', '12L',
    'brakes', 'Disc',
    'suspension', 'Telescopic'
  )
WHERE `name` = 'SOBEN';

UPDATE `vehicle_models` SET
  `category` = 'Motorcycle',
  `base_price` = 950.00,
  `estimated_duration` = 40,
  `warranty_km_limit` = 12000,
  `warranty_max_services` = 2,
  `engine_type` = '4-Stroke',
  `cc_displacement` = 125,
  `fuel_type` = 'Gasoline',
  `transmission` = 'Manual',
  `color_options` = JSON_ARRAY('Black', 'White', 'Silver'),
  `year_range` = '2020-2025',
  `specifications` = JSON_OBJECT(
    'weight', '110kg',
    'max_speed', '100 km/h',
    'fuel_capacity', '10L',
    'brakes', 'Disc',
    'suspension', 'Telescopic'
  )
WHERE `name` = 'KAIN';

UPDATE `vehicle_models` SET
  `category` = 'Heavy Duty',
  `base_price` = 2500.00,
  `estimated_duration` = 90,
  `warranty_km_limit` = 20000,
  `warranty_max_services` = 3,
  `engine_type` = '4-Stroke',
  `cc_displacement` = 250,
  `fuel_type` = 'Gasoline',
  `transmission` = 'Manual',
  `color_options` = JSON_ARRAY('Black', 'White', 'Green'),
  `year_range` = '2020-2025',
  `specifications` = JSON_OBJECT(
    'weight', '180kg',
    'max_speed', '140 km/h',
    'fuel_capacity', '18L',
    'brakes', 'Disc',
    'suspension', 'Telescopic'
  )
WHERE `name` = 'KOUPREY';

UPDATE `vehicle_models` SET
  `category` = 'Family',
  `base_price` = 1800.00,
  `estimated_duration` = 60,
  `warranty_km_limit` = 15000,
  `warranty_max_services` = 2,
  `engine_type` = '4-Stroke',
  `cc_displacement` = 200,
  `fuel_type` = 'Gasoline',
  `transmission` = 'Manual',
  `color_options` = JSON_ARRAY('Black', 'White', 'Blue', 'Red'),
  `year_range` = '2020-2025',
  `specifications` = JSON_OBJECT(
    'weight', '150kg',
    'max_speed', '110 km/h',
    'fuel_capacity', '15L',
    'brakes', 'Disc',
    'suspension', 'Telescopic'
  )
WHERE `name` = 'KRUSAR';

UPDATE `vehicle_models` SET
  `category` = 'Luxury',
  `base_price` = 3200.00,
  `estimated_duration` = 75,
  `warranty_km_limit` = 18000,
  `warranty_max_services` = 3,
  `engine_type` = '4-Stroke',
  `cc_displacement` = 300,
  `fuel_type` = 'Gasoline',
  `transmission` = 'Manual',
  `color_options` = JSON_ARRAY('Black', 'White', 'Gold', 'Silver'),
  `year_range` = '2020-2025',
  `specifications` = JSON_OBJECT(
    'weight', '160kg',
    'max_speed', '150 km/h',
    'fuel_capacity', '16L',
    'brakes', 'Disc',
    'suspension', 'Telescopic'
  )
WHERE `name` = 'KESSOR';

-- Verify the enhanced table structure
SHOW CREATE TABLE `vehicle_models`;

-- Show the updated data
SELECT
  id,
  name,
  category,
  base_price,
  cc_displacement,
  engine_type,
  fuel_type,
  transmission,
  color_options,
  year_range,
  specifications
FROM `vehicle_models`
ORDER BY `name`;
