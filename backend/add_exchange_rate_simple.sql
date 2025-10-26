-- Simple Production Database Update for Exchange Rate Support
-- Run these commands one by one on your production database

-- 1. Add exchange_rate column
ALTER TABLE services 
ADD COLUMN exchange_rate decimal(8,2) DEFAULT 0.00 COMMENT 'Exchange rate USD to KHR (user input required)' 
AFTER service_cost;

-- 2. Add total_khr column  
ALTER TABLE services 
ADD COLUMN total_khr decimal(12,2) DEFAULT 0.00 COMMENT 'Total amount in KHR' 
AFTER exchange_rate;

-- 3. Add indexes for performance
ALTER TABLE services ADD INDEX idx_exchange_rate (exchange_rate);
ALTER TABLE services ADD INDEX idx_total_khr (total_khr);

-- 4. Update existing NULL values to 0
UPDATE services SET exchange_rate = 0 WHERE exchange_rate IS NULL;
UPDATE services SET total_khr = 0 WHERE total_khr IS NULL;

-- 5. Verify the changes
DESCRIBE services;

-- 6. Test with sample data
SELECT id, invoice_number, total_amount, exchange_rate, total_khr 
FROM services 
ORDER BY id DESC 
LIMIT 3;

