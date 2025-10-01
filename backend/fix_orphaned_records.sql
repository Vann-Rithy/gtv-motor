-- Data Integrity Check and Fix Script
-- This script identifies and fixes orphaned records before applying foreign key constraints

-- ==============================================
-- STEP 1: IDENTIFY ORPHANED RECORDS
-- ==============================================

-- Check for orphaned vehicles (vehicles with customer_id not in customers table)
SELECT
    'ORPHANED VEHICLES' as issue_type,
    v.id as vehicle_id,
    v.customer_id,
    v.plate_number,
    'Customer ID does not exist in customers table' as description
FROM vehicles v
LEFT JOIN customers c ON v.customer_id = c.id
WHERE c.id IS NULL;

-- Check for orphaned services (services with customer_id not in customers table)
SELECT
    'ORPHANED SERVICES - CUSTOMER' as issue_type,
    s.id as service_id,
    s.customer_id,
    s.invoice_number,
    'Customer ID does not exist in customers table' as description
FROM services s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE c.id IS NULL;

-- Check for orphaned services (services with vehicle_id not in vehicles table)
SELECT
    'ORPHANED SERVICES - VEHICLE' as issue_type,
    s.id as service_id,
    s.vehicle_id,
    s.invoice_number,
    'Vehicle ID does not exist in vehicles table' as description
FROM services s
LEFT JOIN vehicles v ON s.vehicle_id = v.id
WHERE v.id IS NULL;

-- Check for orphaned service alerts (alerts with customer_id not in customers table)
SELECT
    'ORPHANED SERVICE ALERTS - CUSTOMER' as issue_type,
    sa.id as alert_id,
    sa.customer_id,
    sa.alert_type,
    'Customer ID does not exist in customers table' as description
FROM service_alerts sa
LEFT JOIN customers c ON sa.customer_id = c.id
WHERE c.id IS NULL;

-- Check for orphaned service alerts (alerts with vehicle_id not in vehicles table)
SELECT
    'ORPHANED SERVICE ALERTS - VEHICLE' as issue_type,
    sa.id as alert_id,
    sa.vehicle_id,
    sa.alert_type,
    'Vehicle ID does not exist in vehicles table' as description
FROM service_alerts sa
LEFT JOIN vehicles v ON sa.vehicle_id = v.id
WHERE v.id IS NULL;

-- Check for orphaned warranties (warranties with vehicle_id not in vehicles table)
SELECT
    'ORPHANED WARRANTIES' as issue_type,
    w.id as warranty_id,
    w.vehicle_id,
    w.warranty_type,
    'Vehicle ID does not exist in vehicles table' as description
FROM warranties w
LEFT JOIN vehicles v ON w.vehicle_id = v.id
WHERE v.id IS NULL;

-- Check for orphaned service items (items with service_id not in services table)
SELECT
    'ORPHANED SERVICE ITEMS' as issue_type,
    si.id as item_id,
    si.service_id,
    si.description,
    'Service ID does not exist in services table' as description
FROM service_items si
LEFT JOIN services s ON si.service_id = s.id
WHERE s.id IS NULL;

-- Check for orphaned warranty services (warranty services with warranty_id not in warranties table)
SELECT
    'ORPHANED WARRANTY SERVICES - WARRANTY' as issue_type,
    ws.id as warranty_service_id,
    ws.warranty_id,
    ws.service_type,
    'Warranty ID does not exist in warranties table' as description
FROM warranty_services ws
LEFT JOIN warranties w ON ws.warranty_id = w.id
WHERE w.id IS NULL;

-- Check for orphaned warranty services (warranty services with service_id not in services table)
SELECT
    'ORPHANED WARRANTY SERVICES - SERVICE' as issue_type,
    ws.id as warranty_service_id,
    ws.service_id,
    ws.service_type,
    'Service ID does not exist in services table' as description
FROM warranty_services ws
LEFT JOIN services s ON ws.service_id = s.id
WHERE s.id IS NULL;

-- ==============================================
-- STEP 2: FIX ORPHANED RECORDS
-- ==============================================

-- Option 1: DELETE orphaned records (RECOMMENDED for clean data)
-- Uncomment the following lines to delete orphaned records:

-- Delete orphaned service items first (they depend on services)
-- DELETE si FROM service_items si
-- LEFT JOIN services s ON si.service_id = s.id
-- WHERE s.id IS NULL;

-- Delete orphaned warranty services
-- DELETE ws FROM warranty_services ws
-- LEFT JOIN warranties w ON ws.warranty_id = w.id
-- WHERE w.id IS NULL;

-- DELETE ws FROM warranty_services ws
-- LEFT JOIN services s ON ws.service_id = s.id
-- WHERE s.id IS NULL;

-- Delete orphaned service alerts
-- DELETE sa FROM service_alerts sa
-- LEFT JOIN customers c ON sa.customer_id = c.id
-- WHERE c.id IS NULL;

-- DELETE sa FROM service_alerts sa
-- LEFT JOIN vehicles v ON sa.vehicle_id = v.id
-- WHERE v.id IS NULL;

-- Delete orphaned warranties
-- DELETE w FROM warranties w
-- LEFT JOIN vehicles v ON w.vehicle_id = v.id
-- WHERE v.id IS NULL;

-- Delete orphaned services
-- DELETE s FROM services s
-- LEFT JOIN customers c ON s.customer_id = c.id
-- WHERE c.id IS NULL;

-- DELETE s FROM services s
-- LEFT JOIN vehicles v ON s.vehicle_id = v.id
-- WHERE v.id IS NULL;

-- Delete orphaned vehicles
-- DELETE v FROM vehicles v
-- LEFT JOIN customers c ON v.customer_id = c.id
-- WHERE c.id IS NULL;

-- Option 2: UPDATE orphaned records to reference existing data
-- Uncomment the following lines to update orphaned records instead of deleting:

-- Update orphaned vehicles to reference customer ID 1 (if it exists)
-- UPDATE vehicles v
-- LEFT JOIN customers c ON v.customer_id = c.id
-- SET v.customer_id = 1
-- WHERE c.id IS NULL AND EXISTS (SELECT 1 FROM customers WHERE id = 1);

-- Update orphaned services to reference customer ID 1 (if it exists)
-- UPDATE services s
-- LEFT JOIN customers c ON s.customer_id = c.id
-- SET s.customer_id = 1
-- WHERE c.id IS NULL AND EXISTS (SELECT 1 FROM customers WHERE id = 1);

-- Update orphaned services to reference vehicle ID 1 (if it exists)
-- UPDATE services s
-- LEFT JOIN vehicles v ON s.vehicle_id = v.id
-- SET s.vehicle_id = 1
-- WHERE v.id IS NULL AND EXISTS (SELECT 1 FROM vehicles WHERE id = 1);

-- ==============================================
-- STEP 3: VERIFY DATA INTEGRITY AFTER FIXES
-- ==============================================

-- Re-run the orphaned record checks to verify all issues are resolved
-- (Copy the SELECT statements from STEP 1 here to verify)

-- ==============================================
-- STEP 4: SUMMARY OF ACTIONS NEEDED
-- ==============================================

-- After running the identification queries above, you'll see which records are orphaned.
-- Choose one of these approaches:

-- APPROACH A: DELETE ORPHANED RECORDS (Recommended)
-- 1. Uncomment the DELETE statements in Option 1 above
-- 2. Run the script to clean up orphaned data
-- 3. Then run the main database_fixes_required.sql script

-- APPROACH B: UPDATE ORPHANED RECORDS
-- 1. Uncomment the UPDATE statements in Option 2 above
-- 2. Modify the reference IDs (1) to appropriate existing IDs
-- 3. Run the script to fix orphaned data
-- 4. Then run the main database_fixes_required.sql script

-- APPROACH C: CREATE MISSING REFERENCE RECORDS
-- 1. Identify what customer/vehicle records are missing
-- 2. Create placeholder records for missing references
-- 3. Then run the main database_fixes_required.sql script

-- ==============================================
-- STEP 5: SAFE EXECUTION ORDER
-- ==============================================

-- 1. First run this script to identify orphaned records
-- 2. Review the results and choose your approach (A, B, or C)
-- 3. Execute the chosen approach to fix orphaned data
-- 4. Verify the fixes worked by re-running the identification queries
-- 5. Finally run the main database_fixes_required.sql script

-- ==============================================
-- QUICK FIX FOR IMMEDIATE RESOLUTION
-- ==============================================

-- If you want to quickly fix the most common issues, uncomment these lines:

-- Delete orphaned service items
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

-- Show summary of remaining data
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
