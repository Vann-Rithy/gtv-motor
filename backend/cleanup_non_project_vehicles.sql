-- Cleanup script to remove non-project vehicle models
-- This script removes vehicles that are not part of the GTV Motor project
-- Keeps only: SOBEN, KAIN, KOUPREY, KRUSAR, KESSOR

-- Step 1: Show current non-project vehicles before deletion
SELECT
  'BEFORE CLEANUP - Non-project vehicles to be deleted:' as status,
  id,
  customer_id,
  plate_number,
  model,
  vehicle_model_id,
  year,
  purchase_date
FROM vehicles
WHERE model NOT IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
   OR vehicle_model_id IS NULL
ORDER BY id;

-- Step 2: Count vehicles to be deleted
SELECT
  'VEHICLES TO DELETE:' as action,
  COUNT(*) as count,
  GROUP_CONCAT(DISTINCT model) as models_to_remove
FROM vehicles
WHERE model NOT IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
   OR vehicle_model_id IS NULL;

-- Step 3: Count vehicles to keep
SELECT
  'VEHICLES TO KEEP:' as action,
  COUNT(*) as count,
  GROUP_CONCAT(DISTINCT model) as models_to_keep
FROM vehicles
WHERE model IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
  AND vehicle_model_id IS NOT NULL;

-- Step 4: Delete non-project vehicles
-- First, delete related services for these vehicles
DELETE s FROM services s
JOIN vehicles v ON s.vehicle_id = v.id
WHERE v.model NOT IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
   OR v.vehicle_model_id IS NULL;

-- Delete related warranties for these vehicles
DELETE w FROM warranties w
JOIN vehicles v ON w.vehicle_id = v.id
WHERE v.model NOT IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
   OR v.vehicle_model_id IS NULL;

-- Delete related bookings for these vehicles (extract from JSON)
DELETE b FROM bookings b
WHERE JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.model')) NOT IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
   OR JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.model')) IS NULL;

-- Finally, delete the non-project vehicles
DELETE FROM vehicles
WHERE model NOT IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
   OR vehicle_model_id IS NULL;

-- Step 5: Show remaining vehicles after cleanup
SELECT
  'AFTER CLEANUP - Remaining project vehicles:' as status,
  id,
  customer_id,
  plate_number,
  model,
  vehicle_model_id,
  year,
  purchase_date
FROM vehicles
ORDER BY id;

-- Step 6: Count remaining vehicles by model
SELECT
  'REMAINING VEHICLES BY MODEL:' as summary,
  model,
  COUNT(*) as count,
  vehicle_model_id
FROM vehicles
GROUP BY model, vehicle_model_id
ORDER BY model;

-- Step 7: Show total count after cleanup
SELECT
  'FINAL COUNT:' as summary,
  COUNT(*) as total_vehicles,
  COUNT(DISTINCT model) as unique_models,
  COUNT(vehicle_model_id) as with_model_id,
  COUNT(*) - COUNT(vehicle_model_id) as without_model_id
FROM vehicles;

-- Step 8: Verify all remaining vehicles have proper model relationships
SELECT
  'VERIFICATION - Vehicles without model relationships:' as check_type,
  COUNT(*) as count
FROM vehicles
WHERE vehicle_model_id IS NULL;

-- Step 9: Show sample of remaining vehicles with model details
SELECT
  v.id,
  v.plate_number,
  v.model,
  vm.name as model_name,
  vm.category,
  vm.base_price,
  vm.cc_displacement,
  vm.engine_type
FROM vehicles v
LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
ORDER BY v.id
LIMIT 10;
