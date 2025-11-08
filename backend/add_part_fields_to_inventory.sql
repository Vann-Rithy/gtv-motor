-- Add Part fields to inventory_items table
-- This migration adds fields for Part Plate, Name (Khmer), and Image

-- Check if columns exist before adding them
SET @dbname = DATABASE();
SET @tablename = 'inventory_items';

-- Add part_plate column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname 
    AND TABLE_NAME = @tablename 
    AND COLUMN_NAME = 'part_plate'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `inventory_items` ADD COLUMN `part_plate` varchar(100) DEFAULT NULL AFTER `sku`',
    'SELECT "Column part_plate already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add name_khmer column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname 
    AND TABLE_NAME = @tablename 
    AND COLUMN_NAME = 'name_khmer'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `inventory_items` ADD COLUMN `name_khmer` varchar(255) DEFAULT NULL AFTER `name`',
    'SELECT "Column name_khmer already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add image column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname 
    AND TABLE_NAME = @tablename 
    AND COLUMN_NAME = 'image'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `inventory_items` ADD COLUMN `image` varchar(255) DEFAULT NULL AFTER `name_khmer`',
    'SELECT "Column image already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Success message
SELECT 'Part fields added to inventory_items table successfully!' as status;

