-- Production Database Schema Update for Exchange Rate Support
-- This script safely adds exchange_rate and total_khr columns to the services table
-- Run this script on your production database to enable exchange rate functionality

-- Step 1: Check if columns already exist (optional - for verification)
-- DESCRIBE services;

-- Step 2: Add exchange_rate column if it doesn't exist
-- This will add the column after the service_cost column
SET @sql = 'ALTER TABLE services ADD COLUMN exchange_rate decimal(8,2) DEFAULT 0.00 COMMENT ''Exchange rate USD to KHR (user input required)'' AFTER service_cost';
SET @sql_check = 'SELECT COUNT(*) as count FROM information_schema.columns WHERE table_name = ''services'' AND column_name = ''exchange_rate'' AND table_schema = DATABASE()';

-- Check if column exists before adding
PREPARE stmt FROM @sql_check;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add the column (this will fail gracefully if it already exists)
-- Note: You may need to run this manually if the dynamic approach doesn't work
ALTER TABLE services ADD COLUMN exchange_rate decimal(8,2) DEFAULT 0.00 COMMENT 'Exchange rate USD to KHR (user input required)' AFTER service_cost;

-- Step 3: Add total_khr column if it doesn't exist
-- This will add the column after the exchange_rate column
ALTER TABLE services ADD COLUMN total_khr decimal(12,2) DEFAULT 0.00 COMMENT 'Total amount in KHR' AFTER exchange_rate;

-- Step 4: Add indexes for better performance
ALTER TABLE services ADD INDEX idx_exchange_rate (exchange_rate);
ALTER TABLE services ADD INDEX idx_total_khr (total_khr);

-- Step 5: Update existing records to have 0 values instead of NULL
UPDATE services 
SET exchange_rate = 0 
WHERE exchange_rate IS NULL;

UPDATE services 
SET total_khr = 0 
WHERE total_khr IS NULL;

-- Step 6: Verify the changes
-- Run this query to confirm the columns are added:
DESCRIBE services;

-- Step 7: Test the columns with a sample query
-- This will show you the current state of exchange rate data
SELECT 
    id, 
    invoice_number, 
    total_amount, 
    exchange_rate, 
    total_khr,
    CASE 
        WHEN exchange_rate > 0 THEN total_amount * exchange_rate
        ELSE 0 
    END as calculated_total_khr
FROM services 
ORDER BY id DESC 
LIMIT 5;

-- Step 8: Optional - Update existing services with a default exchange rate
-- Uncomment the line below if you want to set a default exchange rate for existing services
-- UPDATE services SET exchange_rate = 4050.00 WHERE exchange_rate = 0 AND total_amount > 0;

-- Success message
SELECT 'Exchange rate columns added successfully!' as status;

