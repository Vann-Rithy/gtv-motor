-- Create vehicle_models table for dynamic vehicle model management
-- This table stores vehicle models that can be added/edited through the admin interface

CREATE TABLE IF NOT EXISTS `vehicle_models` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert default vehicle models
INSERT INTO `vehicle_models` (`name`, `description`, `is_active`) VALUES
('SOBEN', 'SOBEN motorcycle model', 1),
('KAIN', 'KAIN motorcycle model', 1),
('KOUPREY', 'KOUPREY motorcycle model', 1),
('KRUSAR', 'KRUSAR motorcycle model', 1),
('KESSOR', 'KESSOR motorcycle model', 1)
ON DUPLICATE KEY UPDATE 
  `description` = VALUES(`description`),
  `is_active` = VALUES(`is_active`),
  `updated_at` = current_timestamp();

-- Verify the table was created
SHOW CREATE TABLE `vehicle_models`;

-- Show the inserted data
SELECT * FROM `vehicle_models` ORDER BY `name`;
