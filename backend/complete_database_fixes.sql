-- Complete Database Fix Script - Handles Orphaned Records AND Duplicate Data
-- This script resolves all data integrity issues before applying constraints

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
-- STEP 2: RESOLVE DUPLICATE DATA
-- ==============================================

-- Fix duplicate plate numbers (keep first occurrence, update others)
UPDATE vehicles v1
JOIN (
    SELECT
        plate_number,
        MIN(id) as keep_id
    FROM vehicles
    GROUP BY plate_number
    HAVING COUNT(*) > 1
) v2 ON v1.plate_number = v2.plate_number
SET v1.plate_number = CONCAT(v1.plate_number, '-DUP', v1.id)
WHERE v1.id != v2.keep_id;

-- Fix duplicate invoice numbers (keep first occurrence, update others)
UPDATE services s1
JOIN (
    SELECT
        invoice_number,
        MIN(id) as keep_id
    FROM services
    GROUP BY invoice_number
    HAVING COUNT(*) > 1
) s2 ON s1.invoice_number = s2.invoice_number
SET s1.invoice_number = CONCAT(s1.invoice_number, '-DUP', s1.id)
WHERE s1.id != s2.keep_id;

-- Fix duplicate customer phone numbers (keep first occurrence, update others)
UPDATE customers c1
JOIN (
    SELECT
        phone,
        MIN(id) as keep_id
    FROM customers
    GROUP BY phone
    HAVING COUNT(*) > 1
) c2 ON c1.phone = c2.phone
SET c1.phone = CONCAT(c1.phone, '-DUP', c1.id)
WHERE c1.id != c2.keep_id;

-- Fix duplicate user emails (keep first occurrence, update others)
UPDATE users u1
JOIN (
    SELECT
        email,
        MIN(id) as keep_id
    FROM users
    GROUP BY email
    HAVING COUNT(*) > 1
) u2 ON u1.email = u2.email
SET u1.email = CONCAT(SUBSTRING_INDEX(u1.email, '@', 1), '-DUP', u1.id, '@', SUBSTRING_INDEX(u1.email, '@', -1))
WHERE u1.id != u2.keep_id;

-- Fix duplicate usernames (keep first occurrence, update others)
UPDATE users u1
JOIN (
    SELECT
        username,
        MIN(id) as keep_id
    FROM users
    GROUP BY username
    HAVING COUNT(*) > 1
) u2 ON u1.username = u2.username
SET u1.username = CONCAT(u1.username, '-DUP', u1.id)
WHERE u1.id != u2.keep_id;

-- ==============================================
-- STEP 3: ADD PRIMARY KEY CONSTRAINTS (SAFELY)
-- ==============================================

-- Bookings table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'bookings'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `bookings` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "bookings table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Services table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'services'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `services` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "services table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Service alerts table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'service_alerts'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `service_alerts` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "service_alerts table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Service items table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'service_items'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `service_items` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "service_items table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Service types table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'service_types'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `service_types` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "service_types table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Staff table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'staff'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `staff` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "staff table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Users table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'users'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `users` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "users table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Warranties table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'warranties'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `warranties` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "warranties table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Warranty claims table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'warranty_claims'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `warranty_claims` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "warranty_claims table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Warranty services table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'warranty_services'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `warranty_services` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "warranty_services table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Inventory table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'inventory'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `inventory` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "inventory table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Inventory categories table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'inventory_categories'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `inventory_categories` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "inventory_categories table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Inventory items table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'inventory_items'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `inventory_items` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "inventory_items table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Inventory movements table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'inventory_movements'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `inventory_movements` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "inventory_movements table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Stock movements table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'stock_movements'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `stock_movements` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "stock_movements table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Company settings table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'company_settings'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `company_settings` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "company_settings table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Notification settings table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'notification_settings'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `notification_settings` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "notification_settings table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- System config table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'system_config'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `system_config` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "system_config table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Login attempts table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'login_attempts'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `login_attempts` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "login_attempts table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- User permissions table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'user_permissions'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `user_permissions` ADD PRIMARY KEY (`id`), MODIFY `id` int(11) NOT NULL AUTO_INCREMENT',
    'SELECT "user_permissions table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- User sessions table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'user_sessions'
     AND CONSTRAINT_NAME = 'PRIMARY') = 0,
    'ALTER TABLE `user_sessions` ADD PRIMARY KEY (`id`)',
    'SELECT "user_sessions table already has primary key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==============================================
-- STEP 4: ADD FOREIGN KEY CONSTRAINTS (SAFELY)
-- ==============================================

-- Bookings foreign keys
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'bookings'
     AND CONSTRAINT_NAME = 'fk_bookings_service_type') = 0,
    'ALTER TABLE `bookings` ADD CONSTRAINT `fk_bookings_service_type` FOREIGN KEY (`service_type_id`) REFERENCES `service_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT "fk_bookings_service_type already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Services foreign keys
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'services'
     AND CONSTRAINT_NAME = 'fk_services_customer') = 0,
    'ALTER TABLE `services` ADD CONSTRAINT `fk_services_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT "fk_services_customer already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'services'
     AND CONSTRAINT_NAME = 'fk_services_vehicle') = 0,
    'ALTER TABLE `services` ADD CONSTRAINT `fk_services_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT "fk_services_vehicle already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'services'
     AND CONSTRAINT_NAME = 'fk_services_service_type') = 0,
    'ALTER TABLE `services` ADD CONSTRAINT `fk_services_service_type` FOREIGN KEY (`service_type_id`) REFERENCES `service_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT "fk_services_service_type already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'services'
     AND CONSTRAINT_NAME = 'fk_services_booking') = 0,
    'ALTER TABLE `services` ADD CONSTRAINT `fk_services_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT "fk_services_booking already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'services'
     AND CONSTRAINT_NAME = 'fk_services_technician') = 0,
    'ALTER TABLE `services` ADD CONSTRAINT `fk_services_technician` FOREIGN KEY (`technician_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT "fk_services_technician already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'services'
     AND CONSTRAINT_NAME = 'fk_services_sales_rep') = 0,
    'ALTER TABLE `services` ADD CONSTRAINT `fk_services_sales_rep` FOREIGN KEY (`sales_rep_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT "fk_services_sales_rep already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Service alerts foreign keys
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'service_alerts'
     AND CONSTRAINT_NAME = 'fk_service_alerts_customer') = 0,
    'ALTER TABLE `service_alerts` ADD CONSTRAINT `fk_service_alerts_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT "fk_service_alerts_customer already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'service_alerts'
     AND CONSTRAINT_NAME = 'fk_service_alerts_vehicle') = 0,
    'ALTER TABLE `service_alerts` ADD CONSTRAINT `fk_service_alerts_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT "fk_service_alerts_vehicle already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Service items foreign keys
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'service_items'
     AND CONSTRAINT_NAME = 'fk_service_items_service') = 0,
    'ALTER TABLE `service_items` ADD CONSTRAINT `fk_service_items_service` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT "fk_service_items_service already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vehicles foreign keys
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'vehicles'
     AND CONSTRAINT_NAME = 'fk_vehicles_customer') = 0,
    'ALTER TABLE `vehicles` ADD CONSTRAINT `fk_vehicles_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT "fk_vehicles_customer already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Warranties foreign keys
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'warranties'
     AND CONSTRAINT_NAME = 'fk_warranties_vehicle') = 0,
    'ALTER TABLE `warranties` ADD CONSTRAINT `fk_warranties_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT "fk_warranties_vehicle already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==============================================
-- STEP 5: ADD UNIQUE CONSTRAINTS (SAFELY)
-- ==============================================

-- Ensure unique invoice numbers
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'services'
     AND INDEX_NAME = 'unique_invoice_number') = 0,
    'ALTER TABLE `services` ADD UNIQUE KEY `unique_invoice_number` (`invoice_number`)',
    'SELECT "unique_invoice_number already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure unique plate numbers
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'vehicles'
     AND INDEX_NAME = 'unique_plate_number') = 0,
    'ALTER TABLE `vehicles` ADD UNIQUE KEY `unique_plate_number` (`plate_number`)',
    'SELECT "unique_plate_number already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure unique email addresses for users
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'users'
     AND INDEX_NAME = 'unique_email') = 0,
    'ALTER TABLE `users` ADD UNIQUE KEY `unique_email` (`email`)',
    'SELECT "unique_email already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure unique usernames
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'users'
     AND INDEX_NAME = 'unique_username') = 0,
    'ALTER TABLE `users` ADD UNIQUE KEY `unique_username` (`username`)',
    'SELECT "unique_username already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure unique phone numbers for customers
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'customers'
     AND INDEX_NAME = 'unique_phone') = 0,
    'ALTER TABLE `customers` ADD UNIQUE KEY `unique_phone` (`phone`)',
    'SELECT "unique_phone already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==============================================
-- STEP 6: ADD PERFORMANCE INDEXES (SAFELY)
-- ==============================================

-- Service-related indexes
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'services'
     AND INDEX_NAME = 'idx_services_customer_id') = 0,
    'CREATE INDEX `idx_services_customer_id` ON `services`(`customer_id`)',
    'SELECT "idx_services_customer_id already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'services'
     AND INDEX_NAME = 'idx_services_vehicle_id') = 0,
    'CREATE INDEX `idx_services_vehicle_id` ON `services`(`vehicle_id`)',
    'SELECT "idx_services_vehicle_id already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'services'
     AND INDEX_NAME = 'idx_services_service_date') = 0,
    'CREATE INDEX `idx_services_service_date` ON `services`(`service_date`)',
    'SELECT "idx_services_service_date already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'services'
     AND INDEX_NAME = 'idx_services_payment_status') = 0,
    'CREATE INDEX `idx_services_payment_status` ON `services`(`payment_status`)',
    'SELECT "idx_services_payment_status already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'services'
     AND INDEX_NAME = 'idx_services_service_status') = 0,
    'CREATE INDEX `idx_services_service_status` ON `services`(`service_status`)',
    'SELECT "idx_services_service_status already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vehicle-related indexes
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'vehicles'
     AND INDEX_NAME = 'idx_vehicles_customer_id') = 0,
    'CREATE INDEX `idx_vehicles_customer_id` ON `vehicles`(`customer_id`)',
    'SELECT "idx_vehicles_customer_id already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'vehicles'
     AND INDEX_NAME = 'idx_vehicles_vin_number') = 0,
    'CREATE INDEX `idx_vehicles_vin_number` ON `vehicles`(`vin_number`)',
    'SELECT "idx_vehicles_vin_number already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Customer-related indexes
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'customers'
     AND INDEX_NAME = 'idx_customers_email') = 0,
    'CREATE INDEX `idx_customers_email` ON `customers`(`email`)',
    'SELECT "idx_customers_email already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==============================================
-- STEP 7: CLEAN UP REDUNDANT COLUMNS (SAFELY)
-- ==============================================

-- Remove duplicate columns only if they exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'vehicles'
     AND COLUMN_NAME = 'vehicle_plate') > 0,
    'ALTER TABLE `vehicles` DROP COLUMN `vehicle_plate`',
    'SELECT "vehicle_plate column does not exist" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'customers'
     AND COLUMN_NAME = 'customer_name') > 0,
    'ALTER TABLE `customers` DROP COLUMN `customer_name`',
    'SELECT "customer_name column does not exist" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'customers'
     AND COLUMN_NAME = 'customer_email') > 0,
    'ALTER TABLE `customers` DROP COLUMN `customer_email`',
    'SELECT "customer_email column does not exist" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'customers'
     AND COLUMN_NAME = 'customer_address') > 0,
    'ALTER TABLE `customers` DROP COLUMN `customer_address`',
    'SELECT "customer_address column does not exist" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'staff'
     AND COLUMN_NAME = 'staff_name') > 0,
    'ALTER TABLE `staff` DROP COLUMN `staff_name`',
    'SELECT "staff_name column does not exist" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==============================================
-- STEP 8: FINAL VERIFICATION
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
SELECT 'WARRANTY_SERVICES' as table_name, COUNT(*) as record_count FROM warranty_services
UNION ALL
SELECT 'USERS' as table_name, COUNT(*) as record_count FROM users;

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

-- Show any remaining duplicates (should be 0)
SELECT 'REMAINING_DUPLICATE_PLATE_NUMBERS' as check_type, COUNT(*) as count
FROM (
    SELECT plate_number
    FROM vehicles
    GROUP BY plate_number
    HAVING COUNT(*) > 1
) as duplicates

UNION ALL

SELECT 'REMAINING_DUPLICATE_INVOICE_NUMBERS' as check_type, COUNT(*) as count
FROM (
    SELECT invoice_number
    FROM services
    GROUP BY invoice_number
    HAVING COUNT(*) > 1
) as duplicates

UNION ALL

SELECT 'REMAINING_DUPLICATE_PHONE_NUMBERS' as check_type, COUNT(*) as count
FROM (
    SELECT phone
    FROM customers
    GROUP BY phone
    HAVING COUNT(*) > 1
) as duplicates

UNION ALL

SELECT 'REMAINING_DUPLICATE_USER_EMAILS' as check_type, COUNT(*) as count
FROM (
    SELECT email
    FROM users
    GROUP BY email
    HAVING COUNT(*) > 1
) as duplicates

UNION ALL

SELECT 'REMAINING_DUPLICATE_USERNAMES' as check_type, COUNT(*) as count
FROM (
    SELECT username
    FROM users
    GROUP BY username
    HAVING COUNT(*) > 1
) as duplicates;

COMMIT;
