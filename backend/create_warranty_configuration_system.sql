-- Enhanced Warranty Configuration System for GTV Motor
-- This script creates comprehensive warranty management tables

-- Step 1: Create warranty_components table for detailed component warranties
CREATE TABLE IF NOT EXISTS `warranty_components` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(50) DEFAULT 'Engine',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_component_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Step 2: Create vehicle_model_warranties table for model-specific warranty configurations
CREATE TABLE IF NOT EXISTS `vehicle_model_warranties` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vehicle_model_id` int(11) NOT NULL,
  `warranty_component_id` int(11) NOT NULL,
  `warranty_years` int(11) NOT NULL DEFAULT 5,
  `warranty_kilometers` int(11) NOT NULL DEFAULT 100000,
  `is_applicable` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_model_component` (`vehicle_model_id`, `warranty_component_id`),
  FOREIGN KEY (`vehicle_model_id`) REFERENCES `vehicle_models`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`warranty_component_id`) REFERENCES `warranty_components`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Step 3: Insert warranty components based on the warranty table image
INSERT INTO `warranty_components` (`name`, `description`, `category`) VALUES
('Engine', 'Engine warranty coverage', 'Engine'),
('Car Paint', 'Paint and body warranty coverage', 'Body'),
('Transmission (gearbox)', 'Transmission and gearbox warranty coverage', 'Transmission'),
('Electrical System', 'Electrical components warranty coverage', 'Electrical'),
('Battery Hybrid', 'Hybrid battery warranty coverage', 'Battery');

-- Step 4: Update vehicle_models table to include enhanced warranty fields
ALTER TABLE `vehicle_models` 
ADD COLUMN IF NOT EXISTS `warranty_engine_years` int(11) DEFAULT 10,
ADD COLUMN IF NOT EXISTS `warranty_engine_km` int(11) DEFAULT 200000,
ADD COLUMN IF NOT EXISTS `warranty_paint_years` int(11) DEFAULT 10,
ADD COLUMN IF NOT EXISTS `warranty_paint_km` int(11) DEFAULT 200000,
ADD COLUMN IF NOT EXISTS `warranty_transmission_years` int(11) DEFAULT 5,
ADD COLUMN IF NOT EXISTS `warranty_transmission_km` int(11) DEFAULT 100000,
ADD COLUMN IF NOT EXISTS `warranty_electrical_years` int(11) DEFAULT 5,
ADD COLUMN IF NOT EXISTS `warranty_electrical_km` int(11) DEFAULT 100000,
ADD COLUMN IF NOT EXISTS `warranty_battery_years` int(11) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `warranty_battery_km` int(11) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `has_hybrid_battery` tinyint(1) DEFAULT 0;

-- Step 5: Insert/Update vehicle models with warranty configurations based on the image data
-- SOBEN Model
INSERT INTO `vehicle_models` (
  `name`, `description`, `category`, `base_price`, `estimated_duration`,
  `warranty_km_limit`, `warranty_max_services`, `engine_type`, `cc_displacement`,
  `fuel_type`, `transmission`, `color_options`, `year_range`, `specifications`,
  `warranty_engine_years`, `warranty_engine_km`, `warranty_paint_years`, `warranty_paint_km`,
  `warranty_transmission_years`, `warranty_transmission_km`, `warranty_electrical_years`, `warranty_electrical_km`,
  `warranty_battery_years`, `warranty_battery_km`, `has_hybrid_battery`, `is_active`
) VALUES (
  'SOBEN',
  'Compact Entry SUV - Modern design with safety features, SUV styled for modernity',
  'SUV',
  25000.00,
  60,
  200000,
  2,
  'Petrol',
  1600,
  'Petrol',
  'Automatic',
  '["White", "Black", "Silver", "Red", "Blue"]',
  '2020-2025',
  '{"seats": 5, "doors": 5, "fuel_capacity": 50, "max_speed": 180}',
  10, 200000, 10, 200000, 5, 100000, 5, 100000, NULL, NULL, 0, 1
) ON DUPLICATE KEY UPDATE
  `warranty_engine_years` = 10,
  `warranty_engine_km` = 200000,
  `warranty_paint_years` = 10,
  `warranty_paint_km` = 200000,
  `warranty_transmission_years` = 5,
  `warranty_transmission_km` = 100000,
  `warranty_electrical_years` = 5,
  `warranty_electrical_km` = 100000,
  `warranty_battery_years` = NULL,
  `warranty_battery_km` = NULL,
  `has_hybrid_battery` = 0;

-- KAIN 1.6T&2.0T Model
INSERT INTO `vehicle_models` (
  `name`, `description`, `category`, `base_price`, `estimated_duration`,
  `warranty_km_limit`, `warranty_max_services`, `engine_type`, `cc_displacement`,
  `fuel_type`, `transmission`, `color_options`, `year_range`, `specifications`,
  `warranty_engine_years`, `warranty_engine_km`, `warranty_paint_years`, `warranty_paint_km`,
  `warranty_transmission_years`, `warranty_transmission_km`, `warranty_electrical_years`, `warranty_electrical_km`,
  `warranty_battery_years`, `warranty_battery_km`, `has_hybrid_battery`, `is_active`
) VALUES (
  'KAIN 1.6T&2.0T',
  'Turbocharged SUV with powerful engine options',
  'SUV',
  35000.00,
  75,
  200000,
  2,
  'Turbo Petrol',
  2000,
  'Petrol',
  'Automatic',
  '["White", "Black", "Silver", "Red", "Blue", "Gray"]',
  '2020-2025',
  '{"seats": 7, "doors": 5, "fuel_capacity": 60, "max_speed": 200}',
  10, 200000, 10, 200000, 5, 100000, 5, 100000, NULL, NULL, 0, 1
) ON DUPLICATE KEY UPDATE
  `warranty_engine_years` = 10,
  `warranty_engine_km` = 200000,
  `warranty_paint_years` = 10,
  `warranty_paint_km` = 200000,
  `warranty_transmission_years` = 5,
  `warranty_transmission_km` = 100000,
  `warranty_electrical_years` = 5,
  `warranty_electrical_km` = 100000,
  `warranty_battery_years` = NULL,
  `warranty_battery_km` = NULL,
  `has_hybrid_battery` = 0;

-- KAIN PHEV Model (with hybrid battery)
INSERT INTO `vehicle_models` (
  `name`, `description`, `category`, `base_price`, `estimated_duration`,
  `warranty_km_limit`, `warranty_max_services`, `engine_type`, `cc_displacement`,
  `fuel_type`, `transmission`, `color_options`, `year_range`, `specifications`,
  `warranty_engine_years`, `warranty_engine_km`, `warranty_paint_years`, `warranty_paint_km`,
  `warranty_transmission_years`, `warranty_transmission_km`, `warranty_electrical_years`, `warranty_electrical_km`,
  `warranty_battery_years`, `warranty_battery_km`, `has_hybrid_battery`, `is_active`
) VALUES (
  'KAIN PHEV',
  'Plug-in Hybrid Electric Vehicle with advanced technology',
  'SUV',
  45000.00,
  90,
  200000,
  2,
  'Hybrid',
  2000,
  'Hybrid',
  'Automatic',
  '["White", "Black", "Silver", "Red", "Blue", "Gray"]',
  '2020-2025',
  '{"seats": 7, "doors": 5, "fuel_capacity": 50, "max_speed": 180, "electric_range": 50}',
  10, 200000, 10, 200000, 5, 100000, 5, 100000, 8, 150000, 1, 1
) ON DUPLICATE KEY UPDATE
  `warranty_engine_years` = 10,
  `warranty_engine_km` = 200000,
  `warranty_paint_years` = 10,
  `warranty_paint_km` = 200000,
  `warranty_transmission_years` = 5,
  `warranty_transmission_km` = 100000,
  `warranty_electrical_years` = 5,
  `warranty_electrical_km` = 100000,
  `warranty_battery_years` = 8,
  `warranty_battery_km` = 150000,
  `has_hybrid_battery` = 1;

-- KESSOR Model (with hybrid battery)
INSERT INTO `vehicle_models` (
  `name`, `description`, `category`, `base_price`, `estimated_duration`,
  `warranty_km_limit`, `warranty_max_services`, `engine_type`, `cc_displacement`,
  `fuel_type`, `transmission`, `color_options`, `year_range`, `specifications`,
  `warranty_engine_years`, `warranty_engine_km`, `warranty_paint_years`, `warranty_paint_km`,
  `warranty_transmission_years`, `warranty_transmission_km`, `warranty_electrical_years`, `warranty_electrical_km`,
  `warranty_battery_years`, `warranty_battery_km`, `has_hybrid_battery`, `is_active`
) VALUES (
  'KESSOR',
  'Premium SUV with hybrid technology',
  'SUV',
  55000.00,
  90,
  200000,
  2,
  'Hybrid',
  2500,
  'Hybrid',
  'Automatic',
  '["White", "Black", "Silver", "Red", "Blue", "Gray", "Gold"]',
  '2020-2025',
  '{"seats": 7, "doors": 5, "fuel_capacity": 65, "max_speed": 200, "electric_range": 60}',
  10, 200000, 10, 200000, 5, 100000, 5, 100000, 8, 150000, 1, 1
) ON DUPLICATE KEY UPDATE
  `warranty_engine_years` = 10,
  `warranty_engine_km` = 200000,
  `warranty_paint_years` = 10,
  `warranty_paint_km` = 200000,
  `warranty_transmission_years` = 5,
  `warranty_transmission_km` = 100000,
  `warranty_electrical_years` = 5,
  `warranty_electrical_km` = 100000,
  `warranty_battery_years` = 8,
  `warranty_battery_km` = 150000,
  `has_hybrid_battery` = 1;

-- KOUPREY Model
INSERT INTO `vehicle_models` (
  `name`, `description`, `category`, `base_price`, `estimated_duration`,
  `warranty_km_limit`, `warranty_max_services`, `engine_type`, `cc_displacement`,
  `fuel_type`, `transmission`, `color_options`, `year_range`, `specifications`,
  `warranty_engine_years`, `warranty_engine_km`, `warranty_paint_years`, `warranty_paint_km`,
  `warranty_transmission_years`, `warranty_transmission_km`, `warranty_electrical_years`, `warranty_electrical_km`,
  `warranty_battery_years`, `warranty_battery_km`, `has_hybrid_battery`, `is_active`
) VALUES (
  'KOUPREY',
  'Luxury SUV with premium features',
  'SUV',
  65000.00,
  90,
  200000,
  2,
  'Petrol',
  3000,
  'Petrol',
  'Automatic',
  '["White", "Black", "Silver", "Red", "Blue", "Gray", "Gold", "Brown"]',
  '2020-2025',
  '{"seats": 7, "doors": 5, "fuel_capacity": 70, "max_speed": 220}',
  10, 200000, 10, 200000, 5, 100000, 5, 100000, NULL, NULL, 0, 1
) ON DUPLICATE KEY UPDATE
  `warranty_engine_years` = 10,
  `warranty_engine_km` = 200000,
  `warranty_paint_years` = 10,
  `warranty_paint_km` = 200000,
  `warranty_transmission_years` = 5,
  `warranty_transmission_km` = 100000,
  `warranty_electrical_years` = 5,
  `warranty_electrical_km` = 100000,
  `warranty_battery_years` = NULL,
  `warranty_battery_km` = NULL,
  `has_hybrid_battery` = 0;

-- KOUPREY ZNA Model
INSERT INTO `vehicle_models` (
  `name`, `description`, `category`, `base_price`, `estimated_duration`,
  `warranty_km_limit`, `warranty_max_services`, `engine_type`, `cc_displacement`,
  `fuel_type`, `transmission`, `color_options`, `year_range`, `specifications`,
  `warranty_engine_years`, `warranty_engine_km`, `warranty_paint_years`, `warranty_paint_km`,
  `warranty_transmission_years`, `warranty_transmission_km`, `warranty_electrical_years`, `warranty_electrical_km`,
  `warranty_battery_years`, `warranty_battery_km`, `has_hybrid_battery`, `is_active`
) VALUES (
  'KOUPREY ZNA',
  'Luxury SUV ZNA variant with enhanced features',
  'SUV',
  75000.00,
  90,
  200000,
  2,
  'Petrol',
  3000,
  'Petrol',
  'Automatic',
  '["White", "Black", "Silver", "Red", "Blue", "Gray", "Gold", "Brown"]',
  '2020-2025',
  '{"seats": 7, "doors": 5, "fuel_capacity": 70, "max_speed": 220, "premium_features": true}',
  10, 200000, 10, 200000, 5, 100000, 5, 100000, NULL, NULL, 0, 1
) ON DUPLICATE KEY UPDATE
  `warranty_engine_years` = 10,
  `warranty_engine_km` = 200000,
  `warranty_paint_years` = 10,
  `warranty_paint_km` = 200000,
  `warranty_transmission_years` = 5,
  `warranty_transmission_km` = 100000,
  `warranty_electrical_years` = 5,
  `warranty_electrical_km` = 100000,
  `warranty_battery_years` = NULL,
  `warranty_battery_km` = NULL,
  `has_hybrid_battery` = 0;

-- Step 6: Populate vehicle_model_warranties table with component-specific warranties
-- This will create the detailed warranty configurations for each model
INSERT INTO `vehicle_model_warranties` (`vehicle_model_id`, `warranty_component_id`, `warranty_years`, `warranty_kilometers`, `is_applicable`)
SELECT 
    vm.id as vehicle_model_id,
    wc.id as warranty_component_id,
    CASE 
        WHEN wc.name = 'Engine' THEN vm.warranty_engine_years
        WHEN wc.name = 'Car Paint' THEN vm.warranty_paint_years
        WHEN wc.name = 'Transmission (gearbox)' THEN vm.warranty_transmission_years
        WHEN wc.name = 'Electrical System' THEN vm.warranty_electrical_years
        WHEN wc.name = 'Battery Hybrid' THEN COALESCE(vm.warranty_battery_years, 0)
    END as warranty_years,
    CASE 
        WHEN wc.name = 'Engine' THEN vm.warranty_engine_km
        WHEN wc.name = 'Car Paint' THEN vm.warranty_paint_km
        WHEN wc.name = 'Transmission (gearbox)' THEN vm.warranty_transmission_km
        WHEN wc.name = 'Electrical System' THEN vm.warranty_electrical_km
        WHEN wc.name = 'Battery Hybrid' THEN COALESCE(vm.warranty_battery_km, 0)
    END as warranty_kilometers,
    CASE 
        WHEN wc.name = 'Battery Hybrid' THEN vm.has_hybrid_battery
        ELSE 1
    END as is_applicable
FROM vehicle_models vm
CROSS JOIN warranty_components wc
WHERE vm.is_active = 1 AND wc.is_active = 1
ON DUPLICATE KEY UPDATE
    warranty_years = VALUES(warranty_years),
    warranty_kilometers = VALUES(warranty_kilometers),
    is_applicable = VALUES(is_applicable);

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS `idx_vehicle_model_warranties_model_id` ON `vehicle_model_warranties` (`vehicle_model_id`);
CREATE INDEX IF NOT EXISTS `idx_vehicle_model_warranties_component_id` ON `vehicle_model_warranties` (`warranty_component_id`);
CREATE INDEX IF NOT EXISTS `idx_warranty_components_category` ON `warranty_components` (`category`);

-- Step 8: Create a view for easy warranty information retrieval
CREATE OR REPLACE VIEW `vehicle_warranty_summary` AS
SELECT 
    vm.id as model_id,
    vm.name as model_name,
    vm.category,
    vm.warranty_engine_years,
    vm.warranty_engine_km,
    vm.warranty_paint_years,
    vm.warranty_paint_km,
    vm.warranty_transmission_years,
    vm.warranty_transmission_km,
    vm.warranty_electrical_years,
    vm.warranty_electrical_km,
    vm.warranty_battery_years,
    vm.warranty_battery_km,
    vm.has_hybrid_battery,
    CASE 
        WHEN vm.has_hybrid_battery = 1 THEN CONCAT(vm.warranty_battery_years, ' Years / ', vm.warranty_battery_km, ' km')
        ELSE 'N/A'
    END as battery_warranty_display
FROM vehicle_models vm
WHERE vm.is_active = 1;

-- Success message
SELECT 'Warranty configuration system created successfully!' as status;
