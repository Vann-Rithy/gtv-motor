-- Check current column definitions for exchange_rate and total_khr
-- Run this to see the current state of the columns

SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'services' 
  AND COLUMN_NAME IN ('exchange_rate', 'total_khr');
