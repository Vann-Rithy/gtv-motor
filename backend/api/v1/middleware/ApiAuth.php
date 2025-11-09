<?php
/**
 * API Key Authentication Middleware
 * GTV Motor PHP Backend - API v1
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../includes/Response.php';
require_once __DIR__ . '/ApiAnalytics.php';

class ApiAuth {

    /**
     * Validate API Key
     * Checks both database (api_keys table) and config.php
     */
    public static function validateApiKey() {
        // Start analytics tracking
        ApiAnalytics::startTracking();

        // Get API key from header
        $apiKey = self::getApiKey();

        if (empty($apiKey)) {
            Response::unauthorized('API key is required. Please provide X-API-Key header.');
        }

        $keyConfig = null;
        $keyHash = hash('sha256', $apiKey);

        // First, check database (api_keys table)
        try {
            $database = new Database();
            $db = $database->getConnection();

            $stmt = $db->prepare("
                SELECT id, key_hash, key_name, permissions, rate_limit, active, last_used_at
                FROM api_keys
                WHERE key_hash = ? AND active = 1
            ");
            $stmt->execute([$keyHash]);
            $keyData = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($keyData) {
                // Update last_used_at
                $updateStmt = $db->prepare("UPDATE api_keys SET last_used_at = NOW() WHERE id = ?");
                $updateStmt->execute([$keyData['id']]);

                // Convert to keyConfig format
                $keyConfig = [
                    'name' => $keyData['key_name'],
                    'permissions' => json_decode($keyData['permissions'], true) ?: [],
                    'rate_limit' => (int)$keyData['rate_limit'],
                    'active' => (bool)$keyData['active']
                ];
            }
        } catch (Exception $e) {
            // Database check failed, continue to config.php check
            error_log("API Auth Database Check Error: " . $e->getMessage());
        }

        // If not found in database, check config.php
        if (!$keyConfig) {
            $apiKeys = API_V1_KEYS;

            if (!isset($apiKeys[$apiKey])) {
                Response::unauthorized('Invalid API key.');
            }

            $keyConfig = $apiKeys[$apiKey];
        }

        if (!$keyConfig['active']) {
            Response::forbidden('API key is inactive.');
        }

        // Check rate limiting
        if (API_V1_RATE_LIMIT_ENABLED) {
            self::checkRateLimit($apiKey, $keyConfig['rate_limit']);
        }

        // Log API request
        if (API_V1_LOG_REQUESTS) {
            self::logRequest($apiKey);
        }

        return $keyConfig;
    }

    /**
     * Get API Key from request headers
     */
    public static function getApiKey() {
        $headers = getallheaders();

        // Normalize headers to lowercase keys for case-insensitive lookup
        $headersLower = [];
        if ($headers) {
            foreach ($headers as $key => $value) {
                $headersLower[strtolower($key)] = $value;
            }
        }

        // Check X-API-Key header (case-insensitive)
        if (isset($headersLower['x-api-key'])) {
            return trim($headersLower['x-api-key']);
        }

        // Also check original case (for compatibility)
        if (isset($headers['X-API-Key'])) {
            return trim($headers['X-API-Key']);
        }

        // Check Authorization header (Bearer token format)
        $authHeader = $headersLower['authorization'] ?? $headers['Authorization'] ?? null;
        if ($authHeader) {
            if (strpos($authHeader, 'Bearer ') === 0) {
                return trim(substr($authHeader, 7));
            }
            if (strpos($authHeader, 'ApiKey ') === 0) {
                return trim(substr($authHeader, 7));
            }
        }

        // Check query parameter (less secure, but sometimes needed)
        if (isset($_GET['api_key'])) {
            return trim($_GET['api_key']);
        }

        return null;
    }

    /**
     * Check rate limiting
     */
    private static function checkRateLimit($apiKey, $limit) {
        $rateLimitFile = __DIR__ . '/../../logs/rate_limit_' . md5($apiKey) . '.json';
        $currentHour = date('Y-m-d-H');

        $rateLimitData = [];
        if (file_exists($rateLimitFile)) {
            $rateLimitData = json_decode(file_get_contents($rateLimitFile), true) ?: [];
        }

        // Reset if new hour
        if (!isset($rateLimitData['hour']) || $rateLimitData['hour'] !== $currentHour) {
            $rateLimitData = [
                'hour' => $currentHour,
                'count' => 0
            ];
        }

        // Check limit
        if ($rateLimitData['count'] >= $limit) {
            Response::error('Rate limit exceeded. Maximum ' . $limit . ' requests per hour.', 429);
        }

        // Increment count
        $rateLimitData['count']++;

        // Save rate limit data
        if (!is_dir(dirname($rateLimitFile))) {
            mkdir(dirname($rateLimitFile), 0755, true);
        }
        file_put_contents($rateLimitFile, json_encode($rateLimitData));
    }

    /**
     * Log API request
     */
    private static function logRequest($apiKey) {
        $logFile = API_V1_LOG_FILE;
        $logDir = dirname($logFile);

        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'api_key' => substr($apiKey, 0, 10) . '...', // Partial key for logging
            'method' => $_SERVER['REQUEST_METHOD'],
            'uri' => $_SERVER['REQUEST_URI'],
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];

        file_put_contents($logFile, json_encode($logEntry) . "\n", FILE_APPEND);
    }

    /**
     * Check if request has required permission
     */
    public static function hasPermission($keyConfig, $permission) {
        if (!isset($keyConfig['permissions'])) {
            return false;
        }

        return in_array($permission, $keyConfig['permissions']) || in_array('*', $keyConfig['permissions']);
    }
}

?>
