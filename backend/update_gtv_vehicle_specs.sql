-- Update GTV Motor vehicle models with complete specifications
-- This script updates the vehicle_models table with accurate specifications from GTV Motor

-- Step 1: Update SOBEN specifications
UPDATE `vehicle_models` SET
  `description` = 'Compact Entry SUV - Modern design with safety features',
  `category` = 'Compact SUV',
  `base_price` = 19999.00,
  `estimated_duration` = 60,
  `warranty_km_limit` = 15000,
  `warranty_max_services` = 2,
  `engine_type` = '1.5L Petrol',
  `cc_displacement` = 1500,
  `fuel_type` = 'Petrol',
  `transmission` = 'CVT',
  `color_options` = JSON_ARRAY('Black', 'White', 'Silver', 'Blue', 'Red'),
  `year_range` = '2020-2025',
  `specifications` = JSON_OBJECT(
    'dimensions', '4,400 × 1,831 × 1,653 mm',
    'seating_capacity', '5 seats',
    'segment', 'Compact Entry SUV',
    'features', 'Modern design, safety features, SUV styled for modernity',
    'engine', '1.5L petrol with CVT transmission',
    'price_usd', 19999
  ),
  `updated_at` = NOW()
WHERE `name` = 'SOBEN';

-- Step 2: Update KAIN specifications
UPDATE `vehicle_models` SET
  `description` = 'Premium SUV - Flagship model with luxury features',
  `category` = 'Premium SUV',
  `base_price` = 34950.00,
  `estimated_duration` = 90,
  `warranty_km_limit` = 20000,
  `warranty_max_services` = 3,
  `engine_type` = '1.5T / 2.0T Turbo',
  `cc_displacement` = 1500,
  `fuel_type` = 'Petrol',
  `transmission` = 'Automatic',
  `color_options` = JSON_ARRAY('Black', 'White', 'Silver', 'Gold', 'Blue'),
  `year_range` = '2020-2025',
  `specifications` = JSON_OBJECT(
    'dimensions', 'Larger than Soben',
    'seating_capacity', '7 seats',
    'segment', 'Premium SUV',
    'features', 'Flagship SUV, higher luxury/equipment, bigger size and capacity',
    'engine_options', '1.5T (US$34,950) and 2.0T (US$37,950) turbo engines',
    'price_usd_15t', 34950,
    'price_usd_20t', 37950
  ),
  `updated_at` = NOW()
WHERE `name` = 'KAIN';

-- Step 3: Update KRUSAR specifications
UPDATE `vehicle_models` SET
  `description` = 'Dual-cab Pick-up Truck - Utility vehicle with offroad features',
  `category` = 'Pick-up Truck',
  `base_price` = 27999.00,
  `estimated_duration` = 75,
  `warranty_km_limit` = 18000,
  `warranty_max_services` = 3,
  `engine_type` = '2.0T Turbo',
  `cc_displacement` = 2000,
  `fuel_type` = 'Petrol',
  `transmission` = 'Manual/Automatic',
  `color_options` = JSON_ARRAY('Black', 'White', 'Silver', 'Green', 'Red'),
  `year_range` = '2020-2025',
  `specifications` = JSON_OBJECT(
    'dimensions', 'Standard pick-up truck size',
    'seating_capacity', '5 seats',
    'segment', 'Dual-cab Pick-up Truck',
    'features', 'Rebadged from VGV VX7, offroad/utility features, trim levels differ in equipment',
    'engine', '2.0T turbo petrol',
    'trim_options', 'Half option (US$27,999) and Full option (US$29,999)',
    'price_usd_half', 27999,
    'price_usd_full', 29999
  ),
  `updated_at` = NOW()
WHERE `name` = 'KRUSAR';

-- Step 4: Add CAESAR model (missing from current table)
INSERT INTO `vehicle_models` (
  `name`, `description`, `category`, `base_price`, `estimated_duration`,
  `warranty_km_limit`, `warranty_max_services`, `engine_type`, `cc_displacement`,
  `fuel_type`, `transmission`, `color_options`, `year_range`, `specifications`, `is_active`
) VALUES (
  'CAESAR',
  'Mid-level SUV - Caesar and Caesar-Pro variants',
  'Mid-level SUV',
  26999.00,
  70,
  17000,
  3,
  '1.5L Turbo',
  1500,
  'Petrol',
  'Automatic',
  JSON_ARRAY('Black', 'White', 'Silver', 'Blue', 'Red'),
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
    'price_usd_pro_full', 32999
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

-- Step 5: Add SOBEN-P model (MPV variant)
INSERT INTO `vehicle_models` (
  `name`, `description`, `category`, `base_price`, `estimated_duration`,
  `warranty_km_limit`, `warranty_max_services`, `engine_type`, `cc_displacement`,
  `fuel_type`, `transmission`, `color_options`, `year_range`, `specifications`, `is_active`
) VALUES (
  'SOBEN-P',
  'MPV Multi-purpose Vehicle - Family van variant',
  'MPV',
  21999.00,
  65,
  16000,
  2,
  '1.5L Petrol',
  1500,
  'Petrol',
  'CVT',
  JSON_ARRAY('Black', 'White', 'Silver', 'Blue', 'Red'),
  '2020-2025',
  JSON_OBJECT(
    'dimensions', 'MPV dimensions (larger than Soben)',
    'seating_capacity', '7-8 seats',
    'segment', 'MPV Multi-purpose Vehicle',
    'features', 'Family van, multi-purpose vehicle, based on Soben platform',
    'engine', '1.5L petrol with CVT transmission',
    'price_usd', 21999
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

-- Step 6: Remove KESSOR model (not in the provided specifications)
-- First, update any vehicles using KESSOR to use a different model
UPDATE `vehicles` SET
  `model` = 'KAIN',
  `vehicle_model_id` = (SELECT id FROM vehicle_models WHERE name = 'KAIN' LIMIT 1)
WHERE `model` = 'KESSOR';

-- Then remove the KESSOR model
DELETE FROM `vehicle_models` WHERE `name` = 'KESSOR';

-- Step 7: Show updated vehicle models
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

-- Step 8: Show summary of updated models
SELECT
  'UPDATED VEHICLE MODELS SUMMARY:' as summary,
  COUNT(*) as total_models,
  GROUP_CONCAT(name ORDER BY name) as model_names,
  MIN(base_price) as min_price,
  MAX(base_price) as max_price,
  AVG(base_price) as avg_price
FROM `vehicle_models`;

-- Step 9: Show price range by category
SELECT
  category,
  COUNT(*) as model_count,
  MIN(base_price) as min_price,
  MAX(base_price) as max_price,
  AVG(base_price) as avg_price
FROM `vehicle_models`
GROUP BY category
ORDER BY avg_price;
