-- Check and Fix Vehicle Models Database Setup
-- This script checks the current state and fixes any issues

-- Step 1: Check if vehicle_models table exists and show structure
SELECT 
  'VEHICLE_MODELS TABLE CHECK' as info,
  CASE 
    WHEN COUNT(*) > 0 THEN 'EXISTS'
    ELSE 'NOT EXISTS'
  END as table_status
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name = 'vehicle_models';

-- Step 2: Show current table structure
SELECT
  'CURRENT TABLE STRUCTURE' as info,
  column_name,
  data_type,
  is_nullable,
  column_default,
  column_comment
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'vehicle_models'
ORDER BY ordinal_position;

-- Step 3: Check current data
SELECT 
  'CURRENT DATA COUNT' as info,
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_records,
  COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_records
FROM vehicle_models;

-- Step 4: Show sample data
SELECT 
  'SAMPLE DATA' as info,
  id, name, category, base_price, is_active, created_at
FROM vehicle_models
ORDER BY id
LIMIT 10;

-- Step 5: Check for missing AUTO_INCREMENT
SELECT 
  'AUTO_INCREMENT CHECK' as info,
  AUTO_INCREMENT
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name = 'vehicle_models';

-- Step 6: Fix table structure if needed
-- Drop and recreate table with proper structure
DROP TABLE IF EXISTS `vehicle_models`;

CREATE TABLE `vehicle_models` (
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
  `color_options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Available colors as JSON array' CHECK (json_valid(`color_options`)),
  `year_range` varchar(20) DEFAULT NULL COMMENT 'Model year range (e.g., 2020-2025)',
  `specifications` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Technical specifications as JSON' CHECK (json_valid(`specifications`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Step 7: Insert comprehensive vehicle models data
INSERT INTO `vehicle_models` (
  `name`, `description`, `category`, `base_price`, `estimated_duration`,
  `warranty_km_limit`, `warranty_max_services`, `engine_type`, `cc_displacement`,
  `fuel_type`, `transmission`, `color_options`, `year_range`, `specifications`, `is_active`
) VALUES
('SOBEN', 'Compact Entry SUV - Modern design with safety features, SUV styled for modernity', 'Compact SUV', 19999.00, 60, 15000, 2, '1.5L Petrol', 1500, 'Petrol', 'CVT', 
 '["Black", "White", "Silver", "Blue", "Red"]', '2020-2025', 
 '{"dimensions": "4,400 × 1,831 × 1,653 mm", "seating_capacity": "5 seats", "segment": "Compact Entry SUV", "features": "Modern design, safety features, SUV styled for modernity", "engine": "1.5L petrol with CVT transmission", "price_usd": 19999, "weight": "Approx. 1,400 kg", "fuel_capacity": "50L", "ground_clearance": "180mm"}', 1),

('KAIN', 'Premium SUV - Flagship model with luxury features, bigger size and capacity', 'Premium SUV', 34950.00, 90, 20000, 3, '1.5T / 2.0T Turbo', 1500, 'Petrol', 'Automatic', 
 '["Black", "White", "Silver", "Gold", "Blue", "Red"]', '2020-2025', 
 '{"dimensions": "Larger than Soben and Caesar", "seating_capacity": "7 seats", "segment": "Premium SUV", "features": "Flagship SUV, higher luxury/equipment, bigger size and capacity", "engine_options": "1.5T (US$34,950) and 2.0T (US$37,950) turbo engines", "price_usd_15t": 34950, "price_usd_20t": 37950, "weight": "Approx. 1,800 kg", "fuel_capacity": "70L", "ground_clearance": "220mm", "luxury_features": "Premium interior, advanced safety, luxury equipment"}', 1),

('KOUPREY', 'KOUPREY heavy-duty model', 'Heavy Duty', 2500.00, 90, 20000, 3, '4-Stroke', 250, 'Gasoline', 'Manual', 
 '["Black", "White", "Green"]', '2020-2025', 
 '{"weight": "180kg", "max_speed": "140 km/h", "fuel_capacity": "18L", "brakes": "Disc", "suspension": "Telescopic"}', 1),

('KRUSAR', 'Dual-cab Pick-up Truck - Utility vehicle with offroad features, rebadged from VGV VX7', 'Pick-up Truck', 27999.00, 75, 18000, 3, '2.0T Turbo', 2000, 'Petrol', 'Manual/Automatic', 
 '["Black", "White", "Silver", "Green", "Red", "Blue"]', '2020-2025', 
 '{"dimensions": "Standard dual-cab pick-up truck size", "seating_capacity": "5 seats", "segment": "Dual-cab Pick-up Truck", "features": "Rebadged from VGV VX7, offroad/utility features, trim levels differ in equipment", "engine": "2.0T turbo petrol", "trim_options": "Half option (US$27,999) and Full option (US$29,999)", "price_usd_half": 27999, "price_usd_full": 29999, "weight": "Approx. 1,700 kg", "fuel_capacity": "65L", "ground_clearance": "250mm", "bed_capacity": "Standard pick-up bed", "offroad_features": "4WD capability, offroad suspension"}', 1),

('CAESAR', 'Mid-level SUV - Caesar and Caesar-Pro variants with higher equipment levels', 'Mid-level SUV', 26999.00, 70, 17000, 3, '1.5L Turbo', 1500, 'Petrol', 'Automatic', 
 '["Black", "White", "Silver", "Blue", "Red", "Gold"]', '2020-2025', 
 '{"dimensions": "Mid-size SUV dimensions", "seating_capacity": "5 seats", "segment": "Mid-level SUV", "features": "Options: half/full trim differences, higher equipment levels in Full", "engine": "1.5L Turbo (1.5T)", "variants": "Caesar 1.5T (US$26,999), Caesar Pro Half (US$29,999), Caesar Pro Full (US$32,999)", "price_usd_base": 26999, "price_usd_pro_half": 29999, "price_usd_pro_full": 32999, "weight": "Approx. 1,600 kg", "fuel_capacity": "60L", "ground_clearance": "200mm"}', 1),

('SOBEN-P', 'MPV Multi-purpose Vehicle - Family van variant based on Soben platform', 'MPV', 21999.00, 65, 16000, 2, '1.5L Petrol', 1500, 'Petrol', 'CVT', 
 '["Black", "White", "Silver", "Blue", "Red", "Green"]', '2020-2025', 
 '{"dimensions": "MPV dimensions (larger than Soben)", "seating_capacity": "7-8 seats", "segment": "MPV Multi-purpose Vehicle", "features": "Family van, multi-purpose vehicle, based on Soben platform", "engine": "1.5L petrol with CVT transmission", "price_usd": 21999, "weight": "Approx. 1,500 kg", "fuel_capacity": "55L", "ground_clearance": "180mm", "family_features": "Flexible seating, large cargo space, family-oriented design"}', 1),

('KESSOR', 'KESSOR luxury motorcycle model', 'Motorcycle', 3200.00, 75, 18000, 3, '4-Stroke', 300, 'Gasoline', 'Manual', 
 '["Black", "White", "Gold", "Silver"]', '2020-2025', 
 '{"weight": "160kg", "max_speed": "150 km/h", "fuel_capacity": "16L", "brakes": "Disc", "suspension": "Telescopic"}', 1);

-- Step 8: Verify the setup
SELECT 
  'FINAL VERIFICATION' as info,
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_records,
  COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_records
FROM vehicle_models;

-- Step 9: Show final data
SELECT 
  id, name, category, base_price, engine_type, cc_displacement, is_active
FROM vehicle_models
ORDER BY id;

-- Step 10: Check AUTO_INCREMENT is working
SELECT 
  'AUTO_INCREMENT STATUS' as info,
  AUTO_INCREMENT
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name = 'vehicle_models';
