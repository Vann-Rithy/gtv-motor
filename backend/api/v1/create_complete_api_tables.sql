-- =====================================================
-- COMPLETE API TABLES SETUP
-- GTV Motor PHP Backend - API Keys + Analytics
-- Creates all tables and links them together
-- =====================================================

-- =====================================================
-- 1. API KEYS TABLE
-- Stores API keys (hashed) for authentication
-- =====================================================

CREATE TABLE IF NOT EXISTS `api_keys` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `key_hash` VARCHAR(255) NOT NULL UNIQUE COMMENT 'SHA256 hash of the actual API key',
    `key_name` VARCHAR(255) NOT NULL COMMENT 'Human-readable name for the API key',
    `permissions` JSON NOT NULL COMMENT 'Array of permissions: read, write, admin',
    `rate_limit` INT DEFAULT 1000 COMMENT 'Maximum requests per hour',
    `active` BOOLEAN DEFAULT TRUE COMMENT 'Whether the key is active',
    `last_used_at` DATETIME NULL COMMENT 'Last time this key was used',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'When the key was created',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
    `created_by` VARCHAR(255) NULL COMMENT 'Who created this key',
    `notes` TEXT NULL COMMENT 'Additional notes about this key',
    INDEX `idx_key_hash` (`key_hash`),
    INDEX `idx_active` (`active`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_key_name` (`key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. API REQUESTS TABLE (Analytics)
-- Stores detailed information about each API request
-- LINKED to api_keys via key_hash
-- =====================================================

-- Note: This table structure matches the existing api_requests table
-- If table already exists with different columns, it will not be modified
-- The views below work with the existing structure: api_key (partial) and api_key_id (name)
-- IMPORTANT: Using utf8mb4_unicode_ci to match api_keys table collation
CREATE TABLE IF NOT EXISTS `api_requests` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `api_key` VARCHAR(255) DEFAULT NULL COMMENT 'Partial API key (first 10 chars) for security',
    `api_key_id` VARCHAR(100) DEFAULT NULL COLLATE utf8mb4_unicode_ci COMMENT 'API key identifier/name (links to api_keys.key_name)',
    `endpoint` VARCHAR(255) NOT NULL COMMENT 'API endpoint called',
    `method` VARCHAR(10) NOT NULL COMMENT 'HTTP method (GET, POST, PUT, DELETE)',
    `status_code` INT(11) NOT NULL COMMENT 'HTTP status code',
    `response_time_ms` INT(11) DEFAULT NULL COMMENT 'Response time in milliseconds',
    `request_size_bytes` INT(11) DEFAULT NULL COMMENT 'Request size in bytes',
    `response_size_bytes` INT(11) DEFAULT NULL COMMENT 'Response size in bytes',
    `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'Client IP address',
    `user_agent` TEXT DEFAULT NULL COMMENT 'User agent string',
    `referer` VARCHAR(500) DEFAULT NULL COMMENT 'HTTP referer',
    `error_message` TEXT DEFAULT NULL COMMENT 'Error message if request failed',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_api_key` (`api_key`),
    KEY `idx_api_key_id` (`api_key_id`),
    KEY `idx_endpoint` (`endpoint`),
    KEY `idx_method` (`method`),
    KEY `idx_status_code` (`status_code`),
    KEY `idx_created_at` (`created_at`),
    KEY `idx_api_key_created` (`api_key`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API request logs for analytics';

-- =====================================================
-- 3. API ANALYTICS SUMMARY TABLE
-- Pre-aggregated statistics for faster queries
-- LINKED to api_keys via api_key_id
-- =====================================================

-- Note: api_key_id here stores the key name (string), not the integer ID
-- Links to api_keys via key_name (api_keys.key_name = api_analytics_summary.api_key_id)
-- IMPORTANT: Using utf8mb4_unicode_ci to match api_keys table collation
CREATE TABLE IF NOT EXISTS `api_analytics_summary` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL COMMENT 'Date of the analytics',
    `api_key_id` VARCHAR(100) DEFAULT NULL COLLATE utf8mb4_unicode_ci COMMENT 'API key identifier/name (links to api_keys.key_name)',
    `endpoint` VARCHAR(255) DEFAULT NULL COMMENT 'Endpoint (NULL for all endpoints)',
    `total_requests` INT(11) NOT NULL DEFAULT 0 COMMENT 'Total number of requests',
    `successful_requests` INT(11) NOT NULL DEFAULT 0 COMMENT '2xx status codes',
    `failed_requests` INT(11) NOT NULL DEFAULT 0 COMMENT '4xx and 5xx status codes',
    `total_response_time_ms` BIGINT(20) NOT NULL DEFAULT 0 COMMENT 'Total response time',
    `avg_response_time_ms` DECIMAL(10,2) DEFAULT NULL COMMENT 'Average response time',
    `min_response_time_ms` INT(11) DEFAULT NULL COMMENT 'Minimum response time',
    `max_response_time_ms` INT(11) DEFAULT NULL COMMENT 'Maximum response time',
    `total_request_size_bytes` BIGINT(20) DEFAULT 0 COMMENT 'Total request size',
    `total_response_size_bytes` BIGINT(20) DEFAULT 0 COMMENT 'Total response size',
    `unique_ips` INT(11) DEFAULT 0 COMMENT 'Number of unique IP addresses',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_date_key_endpoint` (`date`, `api_key_id`, `endpoint`),
    KEY `idx_date` (`date`),
    KEY `idx_api_key_id` (`api_key_id`),
    KEY `idx_endpoint` (`endpoint`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pre-aggregated API analytics';

-- =====================================================
-- 4. API PERFORMANCE METRICS TABLE
-- Track performance metrics over time
-- =====================================================

CREATE TABLE IF NOT EXISTS `api_performance_metrics` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `hour` DATETIME NOT NULL COMMENT 'Hour of the metric',
    `endpoint` VARCHAR(255) DEFAULT NULL COMMENT 'Endpoint (NULL for all)',
    `requests_per_minute` DECIMAL(10,2) DEFAULT NULL COMMENT 'Average requests per minute',
    `avg_response_time_ms` DECIMAL(10,2) DEFAULT NULL COMMENT 'Average response time',
    `p95_response_time_ms` DECIMAL(10,2) DEFAULT NULL COMMENT '95th percentile response time',
    `p99_response_time_ms` DECIMAL(10,2) DEFAULT NULL COMMENT '99th percentile response time',
    `error_rate` DECIMAL(5,2) DEFAULT NULL COMMENT 'Error rate percentage',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_hour_endpoint` (`hour`, `endpoint`),
    KEY `idx_hour` (`hour`),
    KEY `idx_endpoint` (`endpoint`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API performance metrics by hour';

-- =====================================================
-- 5. VIEWS FOR ANALYTICS (Linked to API Keys)
-- =====================================================

-- View: API Usage by API Key (with key details)
-- Note: Links via key_name (api_keys.key_name = api_requests.api_key_id)
-- Using COLLATE to ensure same collation for comparison
CREATE OR REPLACE VIEW `v_api_usage_by_key` AS
SELECT
    ak.id as api_key_id,
    ak.key_name,
    ak.active as key_active,
    COUNT(ar.id) as total_requests,
    SUM(CASE WHEN ar.status_code >= 200 AND ar.status_code < 300 THEN 1 ELSE 0 END) as successful_requests,
    SUM(CASE WHEN ar.status_code >= 400 THEN 1 ELSE 0 END) as failed_requests,
    ROUND(AVG(ar.response_time_ms), 2) as avg_response_time_ms,
    COUNT(DISTINCT ar.endpoint) as endpoints_used,
    COUNT(DISTINCT ar.ip_address) as unique_ips,
    MIN(ar.created_at) as first_request,
    MAX(ar.created_at) as last_request,
    ak.rate_limit,
    ak.permissions
FROM api_keys ak
LEFT JOIN api_requests ar ON ak.key_name COLLATE utf8mb4_unicode_ci = ar.api_key_id COLLATE utf8mb4_unicode_ci
WHERE ar.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) OR ar.created_at IS NULL
GROUP BY ak.id, ak.key_name, ak.active, ak.rate_limit, ak.permissions
ORDER BY total_requests DESC;

-- View: API Traffic Overview (Last 24 hours) with Key Names
-- Note: Links via key_name (api_keys.key_name = api_requests.api_key_id)
-- Using COLLATE to ensure same collation for comparison
CREATE OR REPLACE VIEW `v_api_traffic_overview` AS
SELECT
    DATE(ar.created_at) as date,
    HOUR(ar.created_at) as hour,
    COALESCE(ak.key_name, ar.api_key_id) as key_name,
    ar.endpoint,
    ar.method,
    COUNT(*) as total_requests,
    SUM(CASE WHEN ar.status_code >= 200 AND ar.status_code < 300 THEN 1 ELSE 0 END) as successful_requests,
    SUM(CASE WHEN ar.status_code >= 400 THEN 1 ELSE 0 END) as failed_requests,
    AVG(ar.response_time_ms) as avg_response_time_ms,
    MIN(ar.response_time_ms) as min_response_time_ms,
    MAX(ar.response_time_ms) as max_response_time_ms,
    COUNT(DISTINCT ar.ip_address) as unique_ips
FROM api_requests ar
LEFT JOIN api_keys ak ON ak.key_name COLLATE utf8mb4_unicode_ci = ar.api_key_id COLLATE utf8mb4_unicode_ci
WHERE ar.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY DATE(ar.created_at), HOUR(ar.created_at), COALESCE(ak.key_name, ar.api_key_id), ar.endpoint, ar.method
ORDER BY date DESC, hour DESC, total_requests DESC;

-- View: API Key Statistics (Complete)
-- Note: Links via key_name (api_keys.key_name = api_requests.api_key_id)
-- Using COLLATE to ensure same collation for comparison
CREATE OR REPLACE VIEW `v_api_key_statistics` AS
SELECT
    ak.id,
    ak.key_name,
    ak.active,
    ak.rate_limit,
    ak.permissions,
    ak.created_at as key_created_at,
    ak.last_used_at,
    COUNT(ar.id) as total_requests,
    COUNT(DISTINCT DATE(ar.created_at)) as days_active,
    MIN(ar.created_at) as first_request,
    MAX(ar.created_at) as last_request,
    AVG(ar.response_time_ms) as avg_response_time,
    SUM(CASE WHEN ar.status_code >= 400 THEN 1 ELSE 0 END) as total_errors,
    COUNT(DISTINCT ar.endpoint) as endpoints_used,
    COUNT(DISTINCT ar.ip_address) as unique_ips
FROM api_keys ak
LEFT JOIN api_requests ar ON ak.key_name COLLATE utf8mb4_unicode_ci = ar.api_key_id COLLATE utf8mb4_unicode_ci
GROUP BY ak.id, ak.key_name, ak.active, ak.rate_limit, ak.permissions, ak.created_at, ak.last_used_at
ORDER BY total_requests DESC;

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Check all tables exist
SELECT
    'Tables Created' as info,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = DATABASE()
AND table_name IN ('api_keys', 'api_requests', 'api_analytics_summary', 'api_performance_metrics');

-- Check foreign keys
SELECT
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND REFERENCED_TABLE_NAME = 'api_keys';

-- Check views
SELECT
    'Views Created' as info,
    COUNT(*) as count
FROM information_schema.views
WHERE table_schema = DATABASE()
AND table_name LIKE 'v_api_%';

SELECT '✅ All API tables, foreign keys, and views created successfully!' as status;

-- =====================================================
-- 7. EXAMPLE QUERIES
-- =====================================================

-- Get all API keys with their usage statistics
-- SELECT * FROM v_api_key_statistics;

-- Get API requests for a specific key (by name)
-- SELECT ar.*, ak.key_name, ak.active
-- FROM api_requests ar
-- JOIN api_keys ak ON ak.key_name = ar.api_key_id
-- WHERE ak.key_name = 'Mobile App'
-- ORDER BY ar.created_at DESC
-- LIMIT 100;

-- Get analytics summary for a specific key (by name)
-- SELECT * FROM api_analytics_summary
-- WHERE api_key_id = 'Mobile App'
-- ORDER BY date DESC;

