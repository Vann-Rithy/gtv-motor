-- GTV Motor PHP Database Schema
-- Database: gtv_motor_php

CREATE DATABASE IF NOT EXISTS gtv_motor_php CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gtv_motor_php;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'manager', 'service_advisor', 'technician', 'viewer') NOT NULL DEFAULT 'viewer',
    staff_id INT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login DATETIME NULL,
    password_reset_token VARCHAR(255) NULL,
    password_reset_expires DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_staff_id (staff_id)
);

-- User sessions table
CREATE TABLE user_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Login attempts table
CREATE TABLE login_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    success BOOLEAN NOT NULL,
    attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT NULL,
    INDEX idx_email (email),
    INDEX idx_ip_address (ip_address),
    INDEX idx_attempted_at (attempted_at)
);

-- Staff table
CREATE TABLE staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'service_advisor', 'technician', 'manager') NOT NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(100) NULL,
    department VARCHAR(50) NULL,
    hire_date DATE NULL,
    salary DECIMAL(10,2) NULL,
    emergency_contact JSON NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_email (email),
    INDEX idx_active (active)
);

-- Customers table
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NULL,
    email VARCHAR(100) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_email (email),
    INDEX idx_name (name)
);

-- Vehicles table
CREATE TABLE vehicles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    model VARCHAR(100) NOT NULL,
    vin_number VARCHAR(50) NULL,
    year INT NULL,
    current_km INT NULL DEFAULT 0,
    purchase_date DATE NULL,
    warranty_start_date DATE NULL,
    warranty_end_date DATE NULL,
    warranty_km_limit INT NULL DEFAULT 100000,
    warranty_service_count INT NOT NULL DEFAULT 0,
    warranty_max_services INT NULL DEFAULT 10,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_plate_number (plate_number),
    INDEX idx_vin_number (vin_number),
    INDEX idx_warranty_end_date (warranty_end_date)
);

-- Service types table
CREATE TABLE service_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_type_name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_service_type_name (service_type_name)
);

-- Services table
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    service_type_id INT NOT NULL,
    service_date DATE NOT NULL,
    current_km INT NULL,
    next_service_km INT NULL,
    next_service_date DATE NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    service_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method ENUM('cash', 'aba', 'card', 'bank_transfer') NOT NULL DEFAULT 'cash',
    payment_status ENUM('pending', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
    service_status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    notes TEXT NULL,
    technician_id INT NULL,
    sales_rep_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (service_type_id) REFERENCES service_types(id),
    FOREIGN KEY (technician_id) REFERENCES staff(id),
    FOREIGN KEY (sales_rep_id) REFERENCES staff(id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_service_type_id (service_type_id),
    INDEX idx_service_date (service_date),
    INDEX idx_service_status (service_status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_invoice_number (invoice_number)
);

-- Service items table
CREATE TABLE service_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    item_type ENUM('service', 'part', 'labor') NOT NULL DEFAULT 'part',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    INDEX idx_service_id (service_id),
    INDEX idx_item_type (item_type)
);

-- Inventory categories table
CREATE TABLE inventory_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Inventory items table
CREATE TABLE inventory_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NULL,
    current_stock INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 0,
    max_stock INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    supplier VARCHAR(100) NULL,
    last_restocked DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES inventory_categories(id),
    INDEX idx_category_id (category_id),
    INDEX idx_name (name),
    INDEX idx_sku (sku),
    INDEX idx_current_stock (current_stock)
);

-- Stock movements table
CREATE TABLE stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    movement_type ENUM('in', 'out', 'adjustment') NOT NULL,
    quantity INT NOT NULL,
    reference_type ENUM('purchase', 'service', 'adjustment', 'return') NULL,
    reference_id INT NULL,
    notes TEXT NULL,
    staff_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id),
    INDEX idx_item_id (item_id),
    INDEX idx_movement_type (movement_type),
    INDEX idx_reference_type (reference_type),
    INDEX idx_created_at (created_at)
);

-- Service alerts table
CREATE TABLE service_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    alert_type ENUM('service_due', 'warranty_expiring', 'follow_up') NOT NULL,
    alert_date DATE NOT NULL,
    message TEXT NULL,
    status ENUM('pending', 'sent', 'completed') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_alert_type (alert_type),
    INDEX idx_alert_date (alert_date),
    INDEX idx_status (status)
);

-- Bookings table
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(20) NOT NULL,
    customer_data JSON NOT NULL,
    vehicle_data JSON NOT NULL,
    service_type_id INT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status ENUM('confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'confirmed',
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_type_id) REFERENCES service_types(id),
    INDEX idx_phone (phone),
    INDEX idx_service_type_id (service_type_id),
    INDEX idx_booking_date (booking_date),
    INDEX idx_status (status)
);

-- Warranties table
CREATE TABLE warranties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id INT NOT NULL,
    warranty_type ENUM('standard', 'extended', 'premium') NOT NULL DEFAULT 'standard',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    km_limit INT NOT NULL DEFAULT 100000,
    max_services INT NOT NULL DEFAULT 10,
    terms_conditions TEXT NULL,
    status ENUM('active', 'expired', 'suspended', 'cancelled') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_warranty_type (warranty_type),
    INDEX idx_status (status),
    INDEX idx_end_date (end_date)
);

-- Warranty services table
CREATE TABLE warranty_services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    warranty_id INT NOT NULL,
    service_id INT NOT NULL,
    service_date DATE NOT NULL,
    km_at_service INT NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    cost_covered DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warranty_id) REFERENCES warranties(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    INDEX idx_warranty_id (warranty_id),
    INDEX idx_service_id (service_id),
    INDEX idx_service_date (service_date)
);

-- Warranty claims table
CREATE TABLE warranty_claims (
    id INT PRIMARY KEY AUTO_INCREMENT,
    warranty_id INT NOT NULL,
    customer_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    claim_type ENUM('repair', 'replacement', 'maintenance') NOT NULL,
    description TEXT NOT NULL,
    claim_date DATE NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
    estimated_cost DECIMAL(10,2) NULL,
    actual_cost DECIMAL(10,2) NULL,
    approved_by INT NULL,
    approved_date DATE NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (warranty_id) REFERENCES warranties(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES staff(id),
    INDEX idx_warranty_id (warranty_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_claim_type (claim_type),
    INDEX idx_status (status),
    INDEX idx_claim_date (claim_date)
);

-- Company settings table
CREATE TABLE company_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(100) NOT NULL,
    address TEXT NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(100) NULL,
    tax_id VARCHAR(50) NULL,
    logo_url VARCHAR(255) NULL,
    website VARCHAR(255) NULL,
    business_hours VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- System configuration table
CREATE TABLE system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NULL,
    config_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
    description TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key)
);

-- Notification settings table
CREATE TABLE notification_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
);

-- User permissions table
CREATE TABLE user_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    permission VARCHAR(100) NOT NULL,
    granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    granted_by INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_permission (permission)
);

-- Insert default data
INSERT INTO service_types (service_type_name, description) VALUES
('Oil Change', 'Regular oil change service'),
('Brake Service', 'Brake inspection and maintenance'),
('Engine Tune-up', 'Complete engine tune-up service'),
('Transmission Service', 'Transmission fluid change and inspection'),
('Tire Rotation', 'Tire rotation and balancing'),
('AC Service', 'Air conditioning system service'),
('Battery Check', 'Battery testing and replacement if needed'),
('General Inspection', 'General vehicle inspection');

INSERT INTO inventory_categories (name, description) VALUES
('Engine Parts', 'Engine related parts and components'),
('Brake Parts', 'Brake system parts and components'),
('Electrical', 'Electrical system parts and components'),
('Filters', 'Air, oil, and fuel filters'),
('Fluids', 'Engine oil, brake fluid, coolant, etc.'),
('Tires', 'Tires and wheel related items'),
('Tools', 'Service tools and equipment'),
('Consumables', 'General consumable items');

INSERT INTO company_settings (company_name, address, phone, email) VALUES
('GTV Motor', 'Phnom Penh, Cambodia', '+855-XX-XXX-XXX', 'info@gtvmotor.com');

INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('maintenance_reminder_days', '7', 'number', 'Days before service due to send reminder'),
('warranty_reminder_days', '30', 'number', 'Days before warranty expiry to send reminder'),
('low_stock_threshold', '5', 'number', 'Minimum stock level to trigger low stock alert'),
('invoice_prefix', 'INV', 'string', 'Prefix for invoice numbers'),
('timezone', 'Asia/Phnom_Penh', 'string', 'System timezone'),
('currency', 'USD', 'string', 'Default currency'),
('date_format', 'Y-m-d', 'string', 'Default date format'),
('time_format', 'H:i:s', 'string', 'Default time format');

INSERT INTO notification_settings (setting_key, setting_value, description) VALUES
('email_notifications', TRUE, 'Enable email notifications'),
('sms_notifications', FALSE, 'Enable SMS notifications'),
('service_reminders', TRUE, 'Enable service reminders'),
('warranty_reminders', TRUE, 'Enable warranty reminders'),
('low_stock_alerts', TRUE, 'Enable low stock alerts'),
('booking_confirmations', TRUE, 'Enable booking confirmations');

-- Create default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, full_name, role, is_active) VALUES
('admin', 'admin@gtvmotor.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin', TRUE);
