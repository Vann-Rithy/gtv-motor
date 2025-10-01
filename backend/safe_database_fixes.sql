-- Safe Database Schema Fixes with Orphaned Record Handling
-- This script automatically handles orphaned records before applying constraints

-- ==============================================
-- STEP 1: AUTOMATIC ORPHANED RECORD CLEANUP
-- ==============================================

-- Delete orphaned service items first (they depend on services)
DELETE si FROM service_items si
LEFT JOIN services s ON si.service_id = s.id
WHERE s.id IS NULL;

-- Delete orphaned warranty services
DELETE ws FROM warranty_services ws
LEFT JOIN warranties w ON ws.warranty_id = w.id
WHERE w.id IS NULL;

DELETE ws FROM warranty_services ws
LEFT JOIN services s ON ws.service_id = s.id
WHERE s.id IS NULL;

-- Delete orphaned service alerts
DELETE sa FROM service_alerts sa
LEFT JOIN customers c ON sa.customer_id = c.id
WHERE c.id IS NULL;

DELETE sa FROM service_alerts sa
LEFT JOIN vehicles v ON sa.vehicle_id = v.id
WHERE v.id IS NULL;

-- Delete orphaned warranties
DELETE w FROM warranties w
LEFT JOIN vehicles v ON w.vehicle_id = v.id
WHERE v.id IS NULL;

-- Delete orphaned services
DELETE s FROM services s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE c.id IS NULL;

DELETE s FROM services s
LEFT JOIN vehicles v ON s.vehicle_id = v.id
WHERE v.id IS NULL;

-- Delete orphaned vehicles
DELETE v FROM vehicles v
LEFT JOIN customers c ON v.customer_id = c.id
WHERE c.id IS NULL;

-- ==============================================
-- STEP 2: FIX PRIMARY KEY CONSTRAINTS AND AUTO_INCREMENT
-- ==============================================

-- Fix bookings table
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix services table
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix service_alerts table
ALTER TABLE `service_alerts`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix service_items table
ALTER TABLE `service_items`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix service_types table
ALTER TABLE `service_types`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix staff table
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix users table
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix warranties table
ALTER TABLE `warranties`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix warranty_claims table
ALTER TABLE `warranty_claims`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix warranty_services table
ALTER TABLE `warranty_services`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix inventory table
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix inventory_categories table
ALTER TABLE `inventory_categories`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix inventory_items table
ALTER TABLE `inventory_items`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix inventory_movements table
ALTER TABLE `inventory_movements`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix stock_movements table
ALTER TABLE `stock_movements`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix company_settings table
ALTER TABLE `company_settings`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix notification_settings table
ALTER TABLE `notification_settings`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix system_config table
ALTER TABLE `system_config`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix login_attempts table
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix user_permissions table
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`id`),
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Fix user_sessions table
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`);

-- ==============================================
-- STEP 3: ADD FOREIGN KEY CONSTRAINTS (SAFELY)
-- ==============================================

-- Bookings foreign keys
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_service_type`
  FOREIGN KEY (`service_type_id`) REFERENCES `service_types`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Services foreign keys
ALTER TABLE `services`
  ADD CONSTRAINT `fk_services_customer`
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_services_vehicle`
  FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_services_service_type`
  FOREIGN KEY (`service_type_id`) REFERENCES `service_types`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_services_booking`
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_services_technician`
  FOREIGN KEY (`technician_id`) REFERENCES `staff`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_services_sales_rep`
  FOREIGN KEY (`sales_rep_id`) REFERENCES `staff`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Service alerts foreign keys
ALTER TABLE `service_alerts`
  ADD CONSTRAINT `fk_service_alerts_customer`
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_service_alerts_vehicle`
  FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Service items foreign keys
ALTER TABLE `service_items`
  ADD CONSTRAINT `fk_service_items_service`
  FOREIGN KEY (`service_id`) REFERENCES `services`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Vehicles foreign keys
ALTER TABLE `vehicles`
  ADD CONSTRAINT `fk_vehicles_customer`
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Warranties foreign keys
ALTER TABLE `warranties`
  ADD CONSTRAINT `fk_warranties_vehicle`
  FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Warranty claims foreign keys
ALTER TABLE `warranty_claims`
  ADD CONSTRAINT `fk_warranty_claims_warranty`
  FOREIGN KEY (`warranty_id`) REFERENCES `warranties`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_warranty_claims_customer`
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_warranty_claims_vehicle`
  FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_warranty_claims_approved_by`
  FOREIGN KEY (`approved_by`) REFERENCES `staff`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Warranty services foreign keys
ALTER TABLE `warranty_services`
  ADD CONSTRAINT `fk_warranty_services_warranty`
  FOREIGN KEY (`warranty_id`) REFERENCES `warranties`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_warranty_services_service`
  FOREIGN KEY (`service_id`) REFERENCES `services`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Inventory foreign keys
ALTER TABLE `inventory_items`
  ADD CONSTRAINT `fk_inventory_items_category`
  FOREIGN KEY (`category_id`) REFERENCES `inventory_categories`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Inventory movements foreign keys
ALTER TABLE `inventory_movements`
  ADD CONSTRAINT `fk_inventory_movements_inventory`
  FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inventory_movements_staff`
  FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Stock movements foreign keys
ALTER TABLE `stock_movements`
  ADD CONSTRAINT `fk_stock_movements_item`
  FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Users foreign keys
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_staff`
  FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- User permissions foreign keys
ALTER TABLE `user_permissions`
  ADD CONSTRAINT `fk_user_permissions_user`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_user_permissions_granted_by`
  FOREIGN KEY (`granted_by`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- User sessions foreign keys
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `fk_user_sessions_user`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ==============================================
-- STEP 4: ADD PERFORMANCE INDEXES
-- ==============================================

-- Service-related indexes
CREATE INDEX `idx_services_customer_id` ON `services`(`customer_id`);
CREATE INDEX `idx_services_vehicle_id` ON `services`(`vehicle_id`);
CREATE INDEX `idx_services_service_date` ON `services`(`service_date`);
CREATE INDEX `idx_services_payment_status` ON `services`(`payment_status`);
CREATE INDEX `idx_services_service_status` ON `services`(`service_status`);
CREATE INDEX `idx_services_invoice_number` ON `services`(`invoice_number`);

-- Vehicle-related indexes
CREATE INDEX `idx_vehicles_customer_id` ON `vehicles`(`customer_id`);
CREATE INDEX `idx_vehicles_plate_number` ON `vehicles`(`plate_number`);
CREATE INDEX `idx_vehicles_vin_number` ON `vehicles`(`vin_number`);

-- Customer-related indexes
CREATE INDEX `idx_customers_phone` ON `customers`(`phone`);
CREATE INDEX `idx_customers_email` ON `customers`(`email`);

-- Booking-related indexes
CREATE INDEX `idx_bookings_phone` ON `bookings`(`phone`);
CREATE INDEX `idx_bookings_booking_date` ON `bookings`(`booking_date`);
CREATE INDEX `idx_bookings_status` ON `bookings`(`status`);

-- Alert-related indexes
CREATE INDEX `idx_service_alerts_customer_id` ON `service_alerts`(`customer_id`);
CREATE INDEX `idx_service_alerts_vehicle_id` ON `service_alerts`(`vehicle_id`);
CREATE INDEX `idx_service_alerts_alert_date` ON `service_alerts`(`alert_date`);
CREATE INDEX `idx_service_alerts_status` ON `service_alerts`(`status`);

-- Warranty-related indexes
CREATE INDEX `idx_warranties_vehicle_id` ON `warranties`(`vehicle_id`);
CREATE INDEX `idx_warranties_status` ON `warranties`(`status`);
CREATE INDEX `idx_warranties_end_date` ON `warranties`(`end_date`);

-- Inventory-related indexes
CREATE INDEX `idx_inventory_items_category_id` ON `inventory_items`(`category_id`);
CREATE INDEX `idx_inventory_items_current_stock` ON `inventory_items`(`current_stock`);
CREATE INDEX `idx_inventory_items_min_stock` ON `inventory_items`(`min_stock`);

-- User-related indexes
CREATE INDEX `idx_users_email` ON `users`(`email`);
CREATE INDEX `idx_users_username` ON `users`(`username`);
CREATE INDEX `idx_users_role` ON `users`(`role`);

-- ==============================================
-- STEP 5: CLEAN UP REDUNDANT COLUMNS
-- ==============================================

-- Remove duplicate columns in vehicles table
ALTER TABLE `vehicles` DROP COLUMN IF EXISTS `vehicle_plate`;

-- Remove duplicate columns in customers table
ALTER TABLE `customers` DROP COLUMN IF EXISTS `customer_name`;
ALTER TABLE `customers` DROP COLUMN IF EXISTS `customer_email`;
ALTER TABLE `customers` DROP COLUMN IF EXISTS `customer_address`;

-- Remove duplicate columns in staff table
ALTER TABLE `staff` DROP COLUMN IF EXISTS `staff_name`;

-- Remove duplicate columns in warranties table
ALTER TABLE `warranties` DROP COLUMN IF EXISTS `warranty_start_date`;
ALTER TABLE `warranties` DROP COLUMN IF EXISTS `warranty_end_date`;
ALTER TABLE `warranties` DROP COLUMN IF EXISTS `warranty_cost_covered`;

-- ==============================================
-- STEP 6: ADD UNIQUE CONSTRAINTS
-- ==============================================

-- Ensure unique invoice numbers
ALTER TABLE `services` ADD UNIQUE KEY `unique_invoice_number` (`invoice_number`);

-- Ensure unique plate numbers
ALTER TABLE `vehicles` ADD UNIQUE KEY `unique_plate_number` (`plate_number`);

-- Ensure unique email addresses for users
ALTER TABLE `users` ADD UNIQUE KEY `unique_email` (`email`);

-- Ensure unique usernames
ALTER TABLE `users` ADD UNIQUE KEY `unique_username` (`username`);

-- Ensure unique phone numbers for customers
ALTER TABLE `customers` ADD UNIQUE KEY `unique_phone` (`phone`);

-- ==============================================
-- STEP 7: FIX DATA TYPE INCONSISTENCIES
-- ==============================================

-- Ensure consistent decimal precision for monetary fields
ALTER TABLE `services` MODIFY `total_amount` decimal(10,2) NOT NULL;
ALTER TABLE `services` MODIFY `service_cost` decimal(10,2) DEFAULT 100.00;
ALTER TABLE `service_items` MODIFY `unit_price` decimal(10,2) NOT NULL;
ALTER TABLE `service_items` MODIFY `total_price` decimal(10,2) NOT NULL;
ALTER TABLE `inventory_items` MODIFY `unit_price` decimal(10,2) NOT NULL;
ALTER TABLE `inventory_movements` MODIFY `unit_price` decimal(10,2) NOT NULL;
ALTER TABLE `warranty_claims` MODIFY `estimated_cost` decimal(10,2) DEFAULT NULL;
ALTER TABLE `warranty_claims` MODIFY `actual_cost` decimal(10,2) DEFAULT NULL;
ALTER TABLE `warranty_services` MODIFY `cost_covered` decimal(10,2) NOT NULL DEFAULT 0.00;

-- ==============================================
-- STEP 8: ADD DATA VALIDATION CONSTRAINTS
-- ==============================================

-- Ensure positive amounts
ALTER TABLE `services` ADD CONSTRAINT `chk_services_total_amount_positive`
  CHECK (`total_amount` >= 0);

ALTER TABLE `service_items` ADD CONSTRAINT `chk_service_items_unit_price_positive`
  CHECK (`unit_price` >= 0);

ALTER TABLE `service_items` ADD CONSTRAINT `chk_service_items_total_price_positive`
  CHECK (`total_price` >= 0);

-- Ensure valid quantities
ALTER TABLE `service_items` ADD CONSTRAINT `chk_service_items_quantity_positive`
  CHECK (`quantity` > 0);

ALTER TABLE `inventory_items` ADD CONSTRAINT `chk_inventory_items_current_stock_non_negative`
  CHECK (`current_stock` >= 0);

ALTER TABLE `inventory_items` ADD CONSTRAINT `chk_inventory_items_min_stock_non_negative`
  CHECK (`min_stock` >= 0);

-- Ensure valid dates
ALTER TABLE `services` ADD CONSTRAINT `chk_services_service_date_not_future`
  CHECK (`service_date` <= CURDATE());

ALTER TABLE `warranties` ADD CONSTRAINT `chk_warranties_end_date_after_start`
  CHECK (`end_date` > `start_date`);

-- ==============================================
-- STEP 9: UPDATE AUTO_INCREMENT VALUES
-- ==============================================

-- Set AUTO_INCREMENT to appropriate values based on existing data
ALTER TABLE `bookings` AUTO_INCREMENT = 11;
ALTER TABLE `services` AUTO_INCREMENT = 36;
ALTER TABLE `service_alerts` AUTO_INCREMENT = 31;
ALTER TABLE `service_items` AUTO_INCREMENT = 32;
ALTER TABLE `service_types` AUTO_INCREMENT = 16;
ALTER TABLE `staff` AUTO_INCREMENT = 9;
ALTER TABLE `users` AUTO_INCREMENT = 9;
ALTER TABLE `warranties` AUTO_INCREMENT = 25;
ALTER TABLE `warranty_claims` AUTO_INCREMENT = 1;
ALTER TABLE `warranty_services` AUTO_INCREMENT = 8;
ALTER TABLE `inventory` AUTO_INCREMENT = 31;
ALTER TABLE `inventory_categories` AUTO_INCREMENT = 16;
ALTER TABLE `inventory_items` AUTO_INCREMENT = 20;
ALTER TABLE `inventory_movements` AUTO_INCREMENT = 31;
ALTER TABLE `stock_movements` AUTO_INCREMENT = 23;
ALTER TABLE `company_settings` AUTO_INCREMENT = 2;
ALTER TABLE `notification_settings` AUTO_INCREMENT = 9;
ALTER TABLE `system_config` AUTO_INCREMENT = 11;
ALTER TABLE `login_attempts` AUTO_INCREMENT = 455;
ALTER TABLE `user_permissions` AUTO_INCREMENT = 1;

-- ==============================================
-- STEP 10: FINAL VERIFICATION
-- ==============================================

-- Show summary of data after cleanup
SELECT 'CUSTOMERS' as table_name, COUNT(*) as record_count FROM customers
UNION ALL
SELECT 'VEHICLES' as table_name, COUNT(*) as record_count FROM vehicles
UNION ALL
SELECT 'SERVICES' as table_name, COUNT(*) as record_count FROM services
UNION ALL
SELECT 'SERVICE_ALERTS' as table_name, COUNT(*) as record_count FROM service_alerts
UNION ALL
SELECT 'SERVICE_ITEMS' as table_name, COUNT(*) as record_count FROM service_items
UNION ALL
SELECT 'WARRANTIES' as table_name, COUNT(*) as record_count FROM warranties
UNION ALL
SELECT 'WARRANTY_SERVICES' as table_name, COUNT(*) as record_count FROM warranty_services;

-- Show foreign key constraints
SELECT
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;

COMMIT;
