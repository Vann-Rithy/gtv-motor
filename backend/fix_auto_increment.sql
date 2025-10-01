-- Fix AUTO_INCREMENT for customers and vehicles tables
-- This script handles duplicate IDs and adds PRIMARY KEY and AUTO_INCREMENT

-- Step 1: Clean up duplicate ID 0 records in customers table
-- First, let's see how many records have ID 0
SELECT COUNT(*) as duplicate_count FROM `customers` WHERE `id` = 0;

-- Delete duplicate records with ID 0 (keep only one if needed)
-- WARNING: This will delete all customers with ID 0
DELETE FROM `customers` WHERE `id` = 0;

-- Step 2: Clean up duplicate ID 0 records in vehicles table
SELECT COUNT(*) as duplicate_count FROM `vehicles` WHERE `id` = 0;
DELETE FROM `vehicles` WHERE `id` = 0;

-- Step 3: Find the maximum ID in each table
SELECT MAX(`id`) as max_customer_id FROM `customers`;
SELECT MAX(`id`) as max_vehicle_id FROM `vehicles`;

-- Step 4: Add PRIMARY KEY constraints
ALTER TABLE `customers` ADD PRIMARY KEY (`id`);
ALTER TABLE `vehicles` ADD PRIMARY KEY (`id`);

-- Step 5: Add AUTO_INCREMENT
ALTER TABLE `customers` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `vehicles` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Step 6: Set AUTO_INCREMENT to start after the highest existing ID
-- Adjust these numbers based on the MAX results from Step 3
-- Example: if max customer ID is 49, set to 50
-- Example: if max vehicle ID is 99, set to 100
ALTER TABLE `customers` AUTO_INCREMENT = 50;
ALTER TABLE `vehicles` AUTO_INCREMENT = 100;

-- Step 7: Verify the changes
SHOW CREATE TABLE `customers`;
SHOW CREATE TABLE `vehicles`;

-- Step 8: Test by checking the current state
SELECT COUNT(*) as total_customers FROM `customers`;
SELECT COUNT(*) as total_vehicles FROM `vehicles`;
