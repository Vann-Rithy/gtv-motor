-- Create complete vehicle_models table with all enhanced columns
-- This script creates the table with all necessary columns from the start

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

-- Insert default vehicle models with complete information
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

-- Verify the table was created
SHOW CREATE TABLE `vehicle_models`;

-- Show the inserted data
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
