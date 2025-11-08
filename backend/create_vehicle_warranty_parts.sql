-- Vehicle Warranty Parts Table
-- This table stores the warranty parts/components for each vehicle
-- When warranty start date is set on a service, the user can select which warranty parts to apply

CREATE TABLE IF NOT EXISTS `vehicle_warranty_parts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vehicle_id` int(11) NOT NULL,
  `warranty_component_id` int(11) NOT NULL,
  `warranty_years` int(11) NOT NULL,
  `warranty_kilometers` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `km_limit` int(11) NOT NULL,
  `status` enum('active','expired','suspended','cancelled') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_vehicle_id` (`vehicle_id`),
  KEY `idx_warranty_component_id` (`warranty_component_id`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`warranty_component_id`) REFERENCES `warranty_components`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Success message
SELECT 'Vehicle warranty parts table created successfully!' as status;






