<?php
/**
 * API Key Testing Endpoint
 * GTV Motor PHP Backend - Test API Key Functionality
 * Endpoint: api.gtvmotor.dev/v1/test-api-key
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/Request.php';
require_once __DIR__ . '/../../includes/Response.php';
require_once __DIR__ . '/middleware/ApiAuth.php';

try {
    $method = Request::method();

    if ($method !== 'POST') {
        Response::error('Only POST method allowed', 405);
    }

    $data = Request::json();
    $apiKey = $data['api_key'] ?? Request::headers('X-API-Key') ?? Request::query('api_key');

    if (!$apiKey) {
        Response::error('API key is required', 400);
    }

    // Trim and clean the API key
    $apiKey = trim($apiKey);

    // Test the API key
    $keyHash = hash('sha256', $apiKey);
    $database = new Database();
    $db = $database->getConnection();

    // Check in database
    $stmt = $db->prepare("
        SELECT id, key_name, permissions, rate_limit,
               COALESCE(active, 1) as active,
               last_used_at, created_at, key_hash
        FROM api_keys
        WHERE key_hash = ?
    ");
    $stmt->execute([$keyHash]);
    $keyData = $stmt->fetch(PDO::FETCH_ASSOC);

    // Ensure active is properly converted (handle 0/1 or true/false)
    if ($keyData) {
        $keyData['active'] = (bool)$keyData['active'];
    }

    // Debug: Log if not found
    if (!$keyData) {
        error_log("API Key Test - Key not found in database. Hash: " . substr($keyHash, 0, 16) . "...");
        // Check if any keys exist
        $checkStmt = $db->query("SELECT COUNT(*) as count FROM api_keys");
        $count = $checkStmt->fetch(PDO::FETCH_ASSOC);
        error_log("API Key Test - Total keys in database: " . ($count['count']));
    }

    // Also check in config.php
    require_once __DIR__ . '/config.php';
    $configKey = null;
    if (defined('API_V1_KEYS')) {
        foreach (API_V1_KEYS as $key => $config) {
            if (hash('sha256', $key) === $keyHash) {
                $configKey = $config;
                break;
            }
        }
    }

    $result = [
        'valid' => false,
        'active' => false,
        'source' => null,
        'key_info' => null,
        'permissions' => [],
        'rate_limit' => null,
        'test_endpoints' => [],
        'error_message' => null
    ];

    if ($keyData) {
        // Found in database
        $result['valid'] = true;
        $result['active'] = (bool)$keyData['active'];
        $result['source'] = 'database';
        $result['key_info'] = [
            'id' => $keyData['id'],
            'name' => $keyData['key_name'],
            'created_at' => $keyData['created_at'],
            'last_used_at' => $keyData['last_used_at']
        ];
        $result['permissions'] = json_decode($keyData['permissions'], true) ?? [];
        $result['rate_limit'] = $keyData['rate_limit'];

        if (!$keyData['active']) {
            $result['error_message'] = 'API key is inactive';
        }
    } elseif ($configKey) {
        // Found in config
        $result['valid'] = true;
        $result['active'] = $configKey['active'] ?? true;
        $result['source'] = 'config';
        $result['key_info'] = [
            'name' => $configKey['name'] ?? 'Unknown'
        ];
        $result['permissions'] = $configKey['permissions'] ?? [];
        $result['rate_limit'] = $configKey['rate_limit'] ?? 1000;

        if (!($configKey['active'] ?? true)) {
            $result['error_message'] = 'API key is inactive';
        }
    } else {
        // Not found anywhere - provide helpful debugging info
        $result['error_message'] = 'API key not found in database or configuration';
        $result['debug_info'] = [
            'key_length' => strlen($apiKey),
            'key_preview' => substr($apiKey, 0, 8) . '...' . substr($apiKey, -8),
            'hash_preview' => substr($keyHash, 0, 16) . '...'
        ];

        // Check if database has any keys
        try {
            $checkStmt = $db->query("SELECT COUNT(*) as count FROM api_keys");
            $count = $checkStmt->fetch(PDO::FETCH_ASSOC);
            $result['debug_info']['keys_in_database'] = (int)$count['count'];
        } catch (Exception $e) {
            $result['debug_info']['database_error'] = $e->getMessage();
        }
    }

    // Test actual API endpoints
    if ($result['valid'] && $result['active']) {
        $baseUrl = API_V1_BASE_URL ?? 'https://api.gtvmotor.dev/api/v1';

        // Test endpoints based on permissions
        $testEndpoints = [
            ['url' => $baseUrl . '/', 'method' => 'GET', 'name' => 'API Info']
        ];

        if (in_array('read', $result['permissions'])) {
            $testEndpoints[] = ['url' => $baseUrl . '/customers?limit=1', 'method' => 'GET', 'name' => 'Customers (Read)'];
            $testEndpoints[] = ['url' => $baseUrl . '/vehicles?limit=1', 'method' => 'GET', 'name' => 'Vehicles (Read)'];
        }

        foreach ($testEndpoints as &$endpoint) {
            try {
                $ch = curl_init($endpoint['url']);
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_HTTPHEADER => [
                        'X-API-Key: ' . $apiKey,
                        'Content-Type: application/json'
                    ],
                    CURLOPT_TIMEOUT => 5,
                    CURLOPT_CONNECTTIMEOUT => 5
                ]);

                $startTime = microtime(true);
                $response = curl_exec($ch);
                $endTime = microtime(true);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $error = curl_error($ch);
                curl_close($ch);

                $endpoint['test_result'] = [
                    'success' => $httpCode >= 200 && $httpCode < 300,
                    'http_code' => $httpCode,
                    'response_time_ms' => round(($endTime - $startTime) * 1000, 2),
                    'error' => $error ?: null
                ];
            } catch (Exception $e) {
                $endpoint['test_result'] = [
                    'success' => false,
                    'error' => $e->getMessage()
                ];
            }
        }

        $result['test_endpoints'] = $testEndpoints;
    }

    // Get traffic stats for this key (optional - table might not exist)
    if ($keyData) {
        try {
            $stmt = $db->prepare("
                SELECT
                    COUNT(*) as total_requests,
                    COUNT(DISTINCT DATE(created_at)) as days_active,
                    MIN(created_at) as first_request,
                    MAX(created_at) as last_request,
                    AVG(response_time_ms) as avg_response_time,
                    SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as total_errors,
                    SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as total_success
                FROM api_requests
                WHERE api_key_id = (
                    SELECT key_name FROM api_keys WHERE key_hash = ?
                )
            ");
            $stmt->execute([$keyHash]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            $result['traffic_stats'] = $stats;
        } catch (Exception $e) {
            // Table doesn't exist or other error - return empty stats
            $result['traffic_stats'] = [
                'total_requests' => 0,
                'days_active' => 0,
                'first_request' => null,
                'last_request' => null,
                'avg_response_time' => null,
                'total_errors' => 0,
                'total_success' => 0
            ];
        }
    }

    Response::success($result, 'API key test completed');

} catch (Exception $e) {
    error_log("Test API Key Error: " . $e->getMessage());
    Response::error('Internal server error: ' . $e->getMessage(), 500);
}

