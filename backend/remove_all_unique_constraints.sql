-- Comprehensive script to remove ALL unique constraints
-- This allows users to upload duplicate data without restrictions

-- ===========================================
-- CUSTOMERS TABLE CONSTRAINTS
-- ===========================================

-- Remove unique constraint on phone number
ALTER TABLE `customers` DROP INDEX IF EXISTS `unique_phone`;

-- ===========================================
-- VEHICLES TABLE CONSTRAINTS
-- ===========================================

-- Remove unique constraint on plate number per customer
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_customer_plate`;

-- Remove unique constraint on plate number globally
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_plate_number`;

-- Remove unique constraint on VIN number per customer (if exists)
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_customer_vin`;

-- Remove unique constraint on VIN number globally (if exists)
ALTER TABLE `vehicles` DROP INDEX IF EXISTS `unique_vin_number`;

-- ===========================================
-- SERVICES TABLE CONSTRAINTS
-- ===========================================

-- Remove any unique constraints on services (if they exist)
ALTER TABLE `services` DROP INDEX IF EXISTS `unique_service`;
ALTER TABLE `services` DROP INDEX IF EXISTS `unique_invoice_number`;

-- ===========================================
-- SERVICE_ITEMS TABLE CONSTRAINTS
-- ===========================================

-- Remove any unique constraints on service items (if they exist)
ALTER TABLE `service_items` DROP INDEX IF EXISTS `unique_service_item`;

-- ===========================================
-- BOOKINGS TABLE CONSTRAINTS
-- ===========================================

-- Remove any unique constraints on bookings (if they exist)
ALTER TABLE `bookings` DROP INDEX IF EXISTS `unique_booking`;

-- ===========================================
-- ADD REGULAR INDEXES FOR BETTER PERFORMANCE
-- ===========================================

-- Customers table indexes
ALTER TABLE `customers` ADD INDEX `idx_phone` (`phone`);
ALTER TABLE `customers` ADD INDEX `idx_email` (`email`);

-- Vehicles table indexes
ALTER TABLE `vehicles` ADD INDEX `idx_plate_number` (`plate_number`);
ALTER TABLE `vehicles` ADD INDEX `idx_vin_number` (`vin_number`);
ALTER TABLE `vehicles` ADD INDEX `idx_customer_plate` (`customer_id`, `plate_number`);
ALTER TABLE `vehicles` ADD INDEX `idx_customer_vin` (`customer_id`, `vin_number`);

-- Services table indexes
ALTER TABLE `services` ADD INDEX `idx_invoice_number` (`invoice_number`);
ALTER TABLE `services` ADD INDEX `idx_service_date` (`service_date`);
ALTER TABLE `services` ADD INDEX `idx_customer_service` (`customer_id`, `service_date`);

-- Service items table indexes
ALTER TABLE `service_items` ADD INDEX `idx_service_id` (`service_id`);
ALTER TABLE `service_items` ADD INDEX `idx_item_type` (`item_type`);

-- Bookings table indexes
ALTER TABLE `bookings` ADD INDEX `idx_booking_date` (`booking_date`);
ALTER TABLE `bookings` ADD INDEX `idx_customer_booking` (`customer_id`, `booking_date`);

-- ===========================================
-- VERIFY CHANGES
-- ===========================================

-- Show all indexes for each table to verify changes
SHOW INDEX FROM `customers`;
SHOW INDEX FROM `vehicles`;
SHOW INDEX FROM `services`;
SHOW INDEX FROM `service_items`;
SHOW INDEX FROM `bookings`;

-- ===========================================
-- SUMMARY
-- ===========================================

SELECT 'All unique constraints have been removed!' as status;
SELECT 'Regular indexes have been added for better performance!' as performance;
SELECT 'Users can now upload duplicate data without restrictions!' as functionality;
