-- Complete cleanup script to remove all non-project data
-- This script removes all data related to non-GTV vehicles
-- Keeps only: SOBEN, KAIN, KOUPREY, KRUSAR, KESSOR

-- Step 1: Show summary of data to be cleaned
SELECT
  'CLEANUP SUMMARY - Data to be removed:' as action,
  'vehicles' as table_name,
  COUNT(*) as count
FROM vehicles
WHERE model NOT IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
   OR vehicle_model_id IS NULL

UNION ALL

SELECT
  'CLEANUP SUMMARY - Data to be removed:' as action,
  'customers' as table_name,
  COUNT(DISTINCT c.id) as count
FROM customers c
WHERE c.id NOT IN (
  SELECT DISTINCT customer_id
  FROM vehicles
  WHERE model IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
    AND vehicle_model_id IS NOT NULL
)

UNION ALL

SELECT
  'CLEANUP SUMMARY - Data to be removed:' as action,
  'services' as table_name,
  COUNT(*) as count
FROM services s
JOIN vehicles v ON s.vehicle_id = v.id
WHERE v.model NOT IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
   OR v.vehicle_model_id IS NULL

UNION ALL

SELECT
  'CLEANUP SUMMARY - Data to be removed:' as action,
  'bookings' as table_name,
  COUNT(*) as count
FROM bookings b
WHERE JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.model')) NOT IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
   OR JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.model')) IS NULL;

-- Step 2: Delete non-project services first
DELETE s FROM services s
JOIN vehicles v ON s.vehicle_id = v.id
WHERE v.model NOT IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
   OR v.vehicle_model_id IS NULL;

-- Step 3: Delete non-project warranties
DELETE w FROM warranties w
JOIN vehicles v ON w.vehicle_id = v.id
WHERE v.model NOT IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
   OR v.vehicle_model_id IS NULL;

-- Step 4: Delete non-project warranty services
DELETE ws FROM warranty_services ws
JOIN services s ON ws.service_id = s.id
JOIN vehicles v ON s.vehicle_id = v.id
WHERE v.model NOT IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
   OR v.vehicle_model_id IS NULL;

-- Step 5: Delete non-project bookings
DELETE FROM bookings
WHERE JSON_UNQUOTE(JSON_EXTRACT(vehicle_data, '$.model')) NOT IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
   OR JSON_UNQUOTE(JSON_EXTRACT(vehicle_data, '$.model')) IS NULL;

-- Step 6: Delete non-project vehicles
DELETE FROM vehicles
WHERE model NOT IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
   OR vehicle_model_id IS NULL;

-- Step 7: Delete customers with no vehicles
DELETE FROM customers
WHERE id NOT IN (
  SELECT DISTINCT customer_id
  FROM vehicles
  WHERE customer_id IS NOT NULL
);

-- Step 8: Show remaining data summary
SELECT
  'REMAINING DATA SUMMARY:' as action,
  'vehicles' as table_name,
  COUNT(*) as count
FROM vehicles

UNION ALL

SELECT
  'REMAINING DATA SUMMARY:' as action,
  'customers' as table_name,
  COUNT(*) as count
FROM customers

UNION ALL

SELECT
  'REMAINING DATA SUMMARY:' as action,
  'services' as table_name,
  COUNT(*) as count
FROM services

UNION ALL

SELECT
  'REMAINING DATA SUMMARY:' as action,
  'bookings' as table_name,
  COUNT(*) as count
FROM bookings

UNION ALL

SELECT
  'REMAINING DATA SUMMARY:' as action,
  'warranties' as table_name,
  COUNT(*) as count
FROM warranties

UNION ALL

SELECT
  'REMAINING DATA SUMMARY:' as action,
  'warranty_services' as table_name,
  COUNT(*) as count
FROM warranty_services;

-- Step 9: Show remaining vehicles by model
SELECT
  'REMAINING VEHICLES BY MODEL:' as summary,
  v.model,
  vm.name as model_name,
  vm.category,
  COUNT(*) as count
FROM vehicles v
LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
GROUP BY v.model, vm.name, vm.category
ORDER BY v.model;

-- Step 10: Show remaining customers with their vehicles
SELECT
  'REMAINING CUSTOMERS AND VEHICLES:' as summary,
  c.id as customer_id,
  c.name as customer_name,
  c.phone,
  v.id as vehicle_id,
  v.plate_number,
  v.model,
  vm.name as model_name,
  vm.category
FROM customers c
JOIN vehicles v ON c.id = v.customer_id
LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
ORDER BY c.id, v.id;

-- Step 11: Verify all remaining vehicles have proper model relationships
SELECT
  'VERIFICATION - Vehicles without model relationships:' as check_type,
  COUNT(*) as count
FROM vehicles
WHERE vehicle_model_id IS NULL;

-- Step 12: Show final statistics
SELECT
  'FINAL STATISTICS:' as summary,
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(*) FROM vehicles) as total_vehicles,
  (SELECT COUNT(*) FROM services) as total_services,
  (SELECT COUNT(*) FROM bookings) as total_bookings,
  (SELECT COUNT(*) FROM warranties) as total_warranties,
  (SELECT COUNT(*) FROM vehicle_models) as total_vehicle_models;
