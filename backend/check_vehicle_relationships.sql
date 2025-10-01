-- Check current state of vehicle_models relationships
-- This script shows the current status of all vehicle_models related tables and constraints

-- Step 1: Check if vehicle_models table exists
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN 'EXISTS'
    ELSE 'NOT EXISTS'
  END as vehicle_models_table_status
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name = 'vehicle_models';

-- Step 2: Check vehicle_models table structure
SELECT
  'vehicle_models' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  extra
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'vehicle_models'
ORDER BY ordinal_position;

-- Step 3: Check foreign key constraints
SELECT
  table_name,
  constraint_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.key_column_usage
WHERE table_schema = DATABASE()
  AND referenced_table_name = 'vehicle_models'
ORDER BY table_name, constraint_name;

-- Step 4: Check if vehicle_model_id columns exist in related tables
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND column_name = 'vehicle_model_id'
ORDER BY table_name;

-- Step 5: Check indexes on vehicle_model_id columns
SELECT
  table_name,
  index_name,
  column_name,
  non_unique
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND column_name = 'vehicle_model_id'
ORDER BY table_name, index_name;

-- Step 6: Count records in vehicle_models table
SELECT
  'vehicle_models' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_records,
  COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_records
FROM vehicle_models;

-- Step 7: Check vehicles table relationship status
SELECT
  'vehicles' as table_name,
  COUNT(*) as total_vehicles,
  COUNT(vehicle_model_id) as with_model_id,
  COUNT(*) - COUNT(vehicle_model_id) as without_model_id,
  ROUND((COUNT(vehicle_model_id) / COUNT(*)) * 100, 2) as percentage_linked
FROM vehicles;

-- Step 8: Check services table relationship status
SELECT
  'services' as table_name,
  COUNT(*) as total_services,
  COUNT(vehicle_model_id) as with_model_id,
  COUNT(*) - COUNT(vehicle_model_id) as without_model_id,
  ROUND((COUNT(vehicle_model_id) / COUNT(*)) * 100, 2) as percentage_linked
FROM services;

-- Step 9: Check bookings table relationship status
SELECT
  'bookings' as table_name,
  COUNT(*) as total_bookings,
  COUNT(vehicle_model_id) as with_model_id,
  COUNT(*) - COUNT(vehicle_model_id) as without_model_id,
  ROUND((COUNT(vehicle_model_id) / COUNT(*)) * 100, 2) as percentage_linked
FROM bookings;

-- Step 10: Sample of vehicles with model relationships
SELECT
  v.id,
  v.plate_number,
  v.model as old_model_name,
  vm.name as new_model_name,
  vm.category,
  vm.base_price
FROM vehicles v
LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
WHERE v.vehicle_model_id IS NOT NULL
LIMIT 10;

-- Step 11: Sample of vehicles without model relationships
SELECT
  v.id,
  v.plate_number,
  v.model as model_name,
  'NO RELATIONSHIP' as status
FROM vehicles v
WHERE v.vehicle_model_id IS NULL
LIMIT 10;
