-- =====================================================
-- FIX COLLATION FOR EXISTING TABLES
-- Run this if you already have api_requests or api_analytics_summary tables
-- with different collation (utf8mb4_general_ci)
-- =====================================================

-- Fix api_requests table collation
ALTER TABLE `api_requests`
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Specifically fix the api_key_id column if it exists
ALTER TABLE `api_requests`
    MODIFY `api_key_id` VARCHAR(100) DEFAULT NULL COLLATE utf8mb4_unicode_ci;

-- Fix api_analytics_summary table collation
ALTER TABLE `api_analytics_summary`
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Specifically fix the api_key_id column if it exists
ALTER TABLE `api_analytics_summary`
    MODIFY `api_key_id` VARCHAR(100) DEFAULT NULL COLLATE utf8mb4_unicode_ci;

SELECT '✅ Collation fixed for existing tables!' as status;

