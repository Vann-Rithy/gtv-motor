-- Complete GTV Motor Vehicle Models with Full Specifications
-- This script creates/updates the vehicle_models table with accurate GTV Motor specifications

-- Step 1: Create/Update vehicle_models table structure
CREATE TABLE IF NOT EXISTS `vehicle_models` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(50) DEFAULT 'SUV',
  `base_price` decimal(10,2) DEFAULT 0.00,
  `estimated_duration` int(11) DEFAULT 60 COMMENT 'Service duration in minutes',
  `warranty_km_limit` int(11) DEFAULT 15000 COMMENT 'Default warranty kilometers',
  `warranty_max_services` int(11) DEFAULT 2 COMMENT 'Maximum warranty services',
  `engine_type` varchar(50) DEFAULT 'Petrol',
  `cc_displacement` int(11) DEFAULT NULL COMMENT 'Engine displacement in CC',
  `fuel_type` varchar(20) DEFAULT 'Petrol',
  `transmission` varchar(20) DEFAULT 'Automatic',
  `color_options` json DEFAULT NULL COMMENT 'Available colors as JSON array',
  `year_range` varchar(20) DEFAULT NULL COMMENT 'Model year range (e.g., 2020-2025)',
  `specifications` json DEFAULT NULL COMMENT 'Technical specifications as JSON',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Step 2: Insert/Update SOBEN (Compact Entry SUV)
INSERT INTO `vehicle_models` (
  `name`, `description`, `category`, `base_price`, `estimated_duration`,
  `warranty_km_limit`, `warranty_max_services`, `engine_type`, `cc_displacement`,
  `fuel_type`, `transmission`, `color_options`, `year_range`, `specifications`, `is_active`
) VALUES (
  'SOBEN',
  'Compact Entry SUV - Modern design with safety features, SUV styled for modernity',
  'Compact SUV',
  19999.00,
  60,
  15000,
  2,
  '1.5L Petrol',
  1500,
  'Petrol',
  'CVT',
  JSON_ARRAY('Black', 'White', 'Silver', 'Blue', 'Red'),
  '2020-2025',
  JSON_OBJECT(
    'dimensions', '4,400 × 1,831 × 1,653 mm',
    'seating_capacity', '5 seats',
    'segment', 'Compact Entry SUV',
    'features', 'Modern design, safety features, SUV styled for modernity',
    'engine', '1.5L petrol with CVT transmission',
    'price_usd', 19999,
    'weight', 'Approx. 1,400 kg',
    'fuel_capacity', '50L',
    'ground_clearance', '180mm'
  ),
  1
) ON DUPLICATE KEY UPDATE
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
  `updated_at` = NOW();

-- Step 3: Insert/Update CAESAR (Mid-level SUV)
INSERT INTO `vehicle_models` (
  `name`, `description`, `category`, `base_price`, `estimated_duration`,
  `warranty_km_limit`, `warranty_max_services`, `engine_type`, `cc_displacement`,
  `fuel_type`, `transmission`, `color_options`, `year_range`, `specifications`, `is_active`
) VALUES (
  'CAESAR',
  'Mid-level SUV - Caesar and Caesar-Pro variants with higher equipment levels',
  'Mid-level SUV',
  26999.00,
  70,
  17000,
  3,
  '1.5L Turbo',
  1500,
  'Petrol',
  'Automatic',
  JSON_ARRAY('Black', 'White', 'Silver', 'Blue', 'Red', 'Gold'),
  '2020-2025',
  JSON_OBJECT(
    'dimensions', 'Mid-size SUV dimensions',
    'seating_capacity', '5 seats',
    'segment', 'Mid-level SUV',
    'features', 'Options: half/full trim differences, higher equipment levels in Full',
    'engine', '1.5L Turbo (1.5T)',
    'variants', 'Caesar 1.5T (US$26,999), Caesar Pro Half (US$29,999), Caesar Pro Full (US$32,999)',
    'price_usd_base', 26999,
    'price_usd_pro_half', 29999,
    'price_usd_pro_full', 32999,
    'weight', 'Approx. 1,600 kg',
    'fuel_capacity', '60L',
    'ground_clearance', '200mm'
  ),
  1
) ON DUPLICATE KEY UPDATE
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
  `updated_at` = NOW();

-- Step 4: Insert/Update KAIN (Premium SUV)
INSERT INTO `vehicle_models` (
  `name`, `description`, `category`, `base_price`, `estimated_duration`,
  `warranty_km_limit`, `warranty_max_services`, `engine_type`, `cc_displacement`,
  `fuel_type`, `transmission`, `color_options`, `year_range`, `specifications`, `is_active`
) VALUES (
  'KAIN',
  'Premium SUV - Flagship model with luxury features, bigger size and capacity',
  'Premium SUV',
  34950.00,
  90,
  20000,
  3,
  '1.5T / 2.0T Turbo',
  1500,
  'Petrol',
  'Automatic',
  JSON_ARRAY('Black', 'White', 'Silver', 'Gold', 'Blue', 'Red'),
  '2020-2025',
  JSON_OBJECT(
    'dimensions', 'Larger than Soben and Caesar',
    'seating_capacity', '7 seats',
    'segment', 'Premium SUV',
    'features', 'Flagship SUV, higher luxury/equipment, bigger size and capacity',
    'engine_options', '1.5T (US$34,950) and 2.0T (US$37,950) turbo engines',
    'price_usd_15t', 34950,
    'price_usd_20t', 37950,
    'weight', 'Approx. 1,800 kg',
    'fuel_capacity', '70L',
    'ground_clearance', '220mm',
    'luxury_features', 'Premium interior, advanced safety, luxury equipment'
  ),
  1
) ON DUPLICATE KEY UPDATE
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
  `updated_at` = NOW();

-- Step 5: Insert/Update KRUSAR (Dual-cab Pick-up Truck)
INSERT INTO `vehicle_models` (
  `name`, `description`, `category`, `base_price`, `estimated_duration`,
  `warranty_km_limit`, `warranty_max_services`, `engine_type`, `cc_displacement`,
  `fuel_type`, `transmission`, `color_options`, `year_range`, `specifications`, `is_active`
) VALUES (
  'KRUSAR',
  'Dual-cab Pick-up Truck - Utility vehicle with offroad features, rebadged from VGV VX7',
  'Pick-up Truck',
  27999.00,
  75,
  18000,
  3,
  '2.0T Turbo',
  2000,
  'Petrol',
  'Manual/Automatic',
  JSON_ARRAY('Black', 'White', 'Silver', 'Green', 'Red', 'Blue'),
  '2020-2025',
  JSON_OBJECT(
    'dimensions', 'Standard dual-cab pick-up truck size',
    'seating_capacity', '5 seats',
    'segment', 'Dual-cab Pick-up Truck',
    'features', 'Rebadged from VGV VX7, offroad/utility features, trim levels differ in equipment',
    'engine', '2.0T turbo petrol',
    'trim_options', 'Half option (US$27,999) and Full option (US$29,999)',
    'price_usd_half', 27999,
    'price_usd_full', 29999,
    'weight', 'Approx. 1,700 kg',
    'fuel_capacity', '65L',
    'ground_clearance', '250mm',
    'bed_capacity', 'Standard pick-up bed',
    'offroad_features', '4WD capability, offroad suspension'
  ),
  1
) ON DUPLICATE KEY UPDATE
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
  `updated_at` = NOW();

-- Step 6: Insert/Update SOBEN-P (MPV Multi-purpose Vehicle)
INSERT INTO `vehicle_models` (
  `name`, `description`, `category`, `base_price`, `estimated_duration`,
  `warranty_km_limit`, `warranty_max_services`, `engine_type`, `cc_displacement`,
  `fuel_type`, `transmission`, `color_options`, `year_range`, `specifications`, `is_active`
) VALUES (
  'SOBEN-P',
  'MPV Multi-purpose Vehicle - Family van variant based on Soben platform',
  'MPV',
  21999.00,
  65,
  16000,
  2,
  '1.5L Petrol',
  1500,
  'Petrol',
  'CVT',
  JSON_ARRAY('Black', 'White', 'Silver', 'Blue', 'Red', 'Green'),
  '2020-2025',
  JSON_OBJECT(
    'dimensions', 'MPV dimensions (larger than Soben)',
    'seating_capacity', '7-8 seats',
    'segment', 'MPV Multi-purpose Vehicle',
    'features', 'Family van, multi-purpose vehicle, based on Soben platform',
    'engine', '1.5L petrol with CVT transmission',
    'price_usd', 21999,
    'weight', 'Approx. 1,500 kg',
    'fuel_capacity', '55L',
    'ground_clearance', '180mm',
    'family_features', 'Flexible seating, large cargo space, family-oriented design'
  ),
  1
) ON DUPLICATE KEY UPDATE
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
  `updated_at` = NOW();

-- Step 7: Remove KESSOR model (not in the provided specifications)
-- First, update any vehicles using KESSOR to use KAIN instead
UPDATE `vehicles` SET
  `model` = 'KAIN',
  `vehicle_model_id` = (SELECT id FROM vehicle_models WHERE name = 'KAIN' LIMIT 1)
WHERE `model` = 'KESSOR';

-- Then remove the KESSOR model
DELETE FROM `vehicle_models` WHERE `name` = 'KESSOR';

-- Step 8: Show complete vehicle models overview
SELECT
  'GTV MOTOR VEHICLE MODELS OVERVIEW' as title,
  '' as separator;

SELECT
  id,
  name,
  description,
  category,
  base_price,
  engine_type,
  cc_displacement,
  fuel_type,
  transmission,
  color_options,
  specifications
FROM `vehicle_models`
ORDER BY
  CASE
    WHEN name = 'SOBEN' THEN 1
    WHEN name = 'SOBEN-P' THEN 2
    WHEN name = 'CAESAR' THEN 3
    WHEN name = 'KAIN' THEN 4
    WHEN name = 'KRUSAR' THEN 5
    ELSE 6
  END;

-- Step 9: Show price summary by category
SELECT
  'PRICE SUMMARY BY CATEGORY' as title,
  '' as separator;

SELECT
  category,
  COUNT(*) as model_count,
  MIN(base_price) as min_price,
  MAX(base_price) as max_price,
  AVG(base_price) as avg_price,
  GROUP_CONCAT(name ORDER BY base_price) as models
FROM `vehicle_models`
GROUP BY category
ORDER BY avg_price;

-- Step 10: Show engine specifications summary
SELECT
  'ENGINE SPECIFICATIONS SUMMARY' as title,
  '' as separator;

SELECT
  engine_type,
  COUNT(*) as model_count,
  MIN(cc_displacement) as min_cc,
  MAX(cc_displacement) as max_cc,
  GROUP_CONCAT(name ORDER BY cc_displacement) as models
FROM `vehicle_models`
GROUP BY engine_type
ORDER BY min_cc;
