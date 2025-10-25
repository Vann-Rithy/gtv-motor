-- Add volume field to services table
-- This script adds a volume field to store engine volume information for each service

-- Add volume column to services table
ALTER TABLE `services`
ADD COLUMN `volume_l` decimal(5,2) DEFAULT NULL COMMENT 'Engine volume in liters' AFTER `current_km`;

-- Add index for better performance
ALTER TABLE `services`
ADD INDEX `idx_volume_l` (`volume_l`);
