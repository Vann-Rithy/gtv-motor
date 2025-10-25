-- Check exact column names and structure
-- This will help us identify any naming or positioning issues

-- 1. Show all columns in the services table
SELECT 
    COLUMN_NAME,
    ORDINAL_POSITION,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM information_schema.columns 
WHERE table_name = 'services' 
AND table_schema = DATABASE()
ORDER BY ORDINAL_POSITION;

-- 2. Check specifically for exchange rate related columns
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM information_schema.columns 
WHERE table_name = 'services' 
AND table_schema = DATABASE()
AND (COLUMN_NAME LIKE '%exchange%' OR COLUMN_NAME LIKE '%khr%' OR COLUMN_NAME LIKE '%rate%');

-- 3. Check if there are any constraints on the services table
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    COLUMN_NAME
FROM information_schema.key_column_usage 
WHERE table_name = 'services' 
AND table_schema = DATABASE();

-- 4. Test a simple SELECT to see if we can access the columns
SELECT 
    id, 
    invoice_number, 
    total_amount, 
    exchange_rate, 
    total_khr,
    created_at
FROM services 
ORDER BY id DESC 
LIMIT 3;
