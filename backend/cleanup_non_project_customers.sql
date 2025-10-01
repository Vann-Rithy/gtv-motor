-- Cleanup script to remove customers with non-project vehicles
-- This script removes customers who only have non-GTV vehicles
-- Keeps customers with at least one GTV vehicle (SOBEN, KAIN, KOUPREY, KRUSAR, KESSOR)

-- Step 1: Show customers with non-project vehicles before cleanup
SELECT
  'BEFORE CLEANUP - Customers with non-project vehicles:' as status,
  c.id,
  c.name,
  c.phone,
  v.model,
  v.plate_number
FROM customers c
JOIN vehicles v ON c.id = v.customer_id
WHERE v.model NOT IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
   OR v.vehicle_model_id IS NULL
ORDER BY c.id, v.id;

-- Step 2: Identify customers to delete (customers with ONLY non-project vehicles)
SELECT
  'CUSTOMERS TO DELETE (only non-project vehicles):' as action,
  c.id,
  c.name,
  c.phone,
  COUNT(v.id) as vehicle_count,
  GROUP_CONCAT(v.model) as vehicle_models
FROM customers c
JOIN vehicles v ON c.id = v.customer_id
WHERE c.id NOT IN (
  -- Customers who have at least one project vehicle
  SELECT DISTINCT customer_id
  FROM vehicles
  WHERE model IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
    AND vehicle_model_id IS NOT NULL
)
GROUP BY c.id, c.name, c.phone
ORDER BY c.id;

-- Step 3: Count customers to be deleted
SELECT
  'CUSTOMERS TO DELETE COUNT:' as summary,
  COUNT(DISTINCT c.id) as customer_count
FROM customers c
WHERE c.id NOT IN (
  -- Customers who have at least one project vehicle
  SELECT DISTINCT customer_id
  FROM vehicles
  WHERE model IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
    AND vehicle_model_id IS NOT NULL
);

-- Step 4: Count customers to keep
SELECT
  'CUSTOMERS TO KEEP COUNT:' as summary,
  COUNT(DISTINCT c.id) as customer_count
FROM customers c
WHERE c.id IN (
  -- Customers who have at least one project vehicle
  SELECT DISTINCT customer_id
  FROM vehicles
  WHERE model IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
    AND vehicle_model_id IS NOT NULL
);

-- Step 5: Delete customers with only non-project vehicles
-- First, delete related services for these customers
DELETE s FROM services s
JOIN customers c ON s.customer_id = c.id
WHERE c.id NOT IN (
  -- Customers who have at least one project vehicle
  SELECT DISTINCT customer_id
  FROM vehicles
  WHERE model IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
    AND vehicle_model_id IS NOT NULL
);

-- Delete related bookings for these customers
DELETE b FROM bookings b
WHERE b.customer_data IS NOT NULL
  AND JSON_UNQUOTE(JSON_EXTRACT(b.customer_data, '$.name')) IN (
    SELECT c.name
    FROM customers c
    WHERE c.id NOT IN (
      -- Customers who have at least one project vehicle
      SELECT DISTINCT customer_id
      FROM vehicles
      WHERE model IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
        AND vehicle_model_id IS NOT NULL
    )
  );

-- Delete the customers themselves
DELETE FROM customers
WHERE id NOT IN (
  -- Customers who have at least one project vehicle
  SELECT DISTINCT customer_id
  FROM vehicles
  WHERE model IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
    AND vehicle_model_id IS NOT NULL
);

-- Step 6: Show remaining customers after cleanup
SELECT
  'AFTER CLEANUP - Remaining customers:' as status,
  c.id,
  c.name,
  c.phone,
  c.email,
  COUNT(v.id) as vehicle_count,
  GROUP_CONCAT(v.model) as vehicle_models
FROM customers c
LEFT JOIN vehicles v ON c.id = v.customer_id
GROUP BY c.id, c.name, c.phone, c.email
ORDER BY c.id;

-- Step 7: Show final customer count
SELECT
  'FINAL CUSTOMER COUNT:' as summary,
  COUNT(*) as total_customers
FROM customers;

-- Step 8: Show customers with their GTV vehicles
SELECT
  'CUSTOMERS WITH GTV VEHICLES:' as summary,
  c.id as customer_id,
  c.name as customer_name,
  c.phone,
  v.id as vehicle_id,
  v.plate_number,
  v.model,
  vm.name as model_name,
  vm.category,
  vm.base_price
FROM customers c
JOIN vehicles v ON c.id = v.customer_id
LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
WHERE v.model IN ('SOBEN', 'KAIN', 'KOUPREY', 'KRUSAR', 'KESSOR')
ORDER BY c.id, v.id;
