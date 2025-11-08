-- Verification Script for Exchange Rate Columns
-- Run this to check if the exchange_rate and total_khr columns exist

-- Check if columns exist
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM information_schema.columns 
WHERE table_name = 'services' 
AND table_schema = DATABASE()
AND COLUMN_NAME IN ('exchange_rate', 'total_khr')
ORDER BY ORDINAL_POSITION;

-- Check total number of columns in services table
SELECT COUNT(*) as total_columns 
FROM information_schema.columns 
WHERE table_name = 'services' 
AND table_schema = DATABASE();

-- Show all columns in services table
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.columns 
WHERE table_name = 'services' 
AND table_schema = DATABASE()
ORDER BY ORDINAL_POSITION;

-- Test query to see if we can select exchange_rate and total_khr
SELECT 
    id, 
    invoice_number, 
    total_amount, 
    exchange_rate, 
    total_khr
FROM services 
LIMIT 1;






