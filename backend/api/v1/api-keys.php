<?php
/**
 * API Key Management Endpoint
 * GTV Motor PHP Backend - Full API Key Control
 * Endpoint: api.gtvmotor.dev/v1/api-keys
 */

// Load config first to set CORS headers
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/Request.php';
require_once __DIR__ . '/../../includes/Response.php';
require_once __DIR__ . '/middleware/ApiAuth.php';

try {
    // Validate API Key (admin key required for key management)
    $keyConfig = ApiAuth::validateApiKey();

    // Check if key has admin permissions
    if (!in_array('admin', $keyConfig['permissions'] ?? [])) {
        Response::forbidden('Admin permissions required for API key management');
    }

    $method = Request::method();
    $database = new Database();
    $db = $database->getConnection();

    // Ensure api_keys table exists
    $db->exec("
        CREATE TABLE IF NOT EXISTS api_keys (
            id INT AUTO_INCREMENT PRIMARY KEY,
            key_hash VARCHAR(255) NOT NULL UNIQUE,
            key_name VARCHAR(255) NOT NULL,
            permissions JSON NOT NULL,
            rate_limit INT DEFAULT 1000,
            active BOOLEAN DEFAULT TRUE,
            last_used_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by VARCHAR(255) NULL,
            notes TEXT NULL,
            INDEX idx_key_hash (key_hash),
            INDEX idx_active (active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    switch ($method) {
        case 'GET':
            // List all API keys or get specific key
            $keyId = Request::query('id');

            if ($keyId) {
                // Get specific key (without showing the actual key, only hash)
                $stmt = $db->prepare("
                    SELECT id, key_hash, key_name, permissions, rate_limit, active,
                           last_used_at, created_at, updated_at, created_by, notes
                    FROM api_keys
                    WHERE id = ?
                ");
                $stmt->execute([$keyId]);
                $key = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$key) {
                    Response::notFound('API key not found');
                }

                // Get usage stats (optional - table might not exist)
                try {
                    $stmt = $db->prepare("
                        SELECT
                            COUNT(*) as total_requests,
                            COUNT(DISTINCT DATE(created_at)) as days_active,
                            MIN(created_at) as first_request,
                            MAX(created_at) as last_request,
                            AVG(response_time_ms) as avg_response_time,
                            SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as total_errors
                        FROM api_requests
                        WHERE api_key_id = ?
                    ");
                    $stmt->execute([$key['key_name']]);
                    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
                } catch (Exception $e) {
                    // Table doesn't exist or other error - return empty stats
                    $stats = [
                        'total_requests' => 0,
                        'days_active' => 0,
                        'first_request' => null,
                        'last_request' => null,
                        'avg_response_time' => null,
                        'total_errors' => 0
                    ];
                }

                $key['usage_stats'] = $stats;
                $key['permissions'] = json_decode($key['permissions'], true);

                Response::success($key, 'API key retrieved successfully');
            } else {
                // List all keys
                $stmt = $db->query("
                    SELECT id, key_hash, key_name, permissions, rate_limit, active,
                           last_used_at, created_at, updated_at, created_by, notes
                    FROM api_keys
                    ORDER BY created_at DESC
                ");
                $keys = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Get usage stats for each key (optional - table might not exist)
                foreach ($keys as &$key) {
                    try {
                        $stmt = $db->prepare("
                            SELECT
                                COUNT(*) as total_requests,
                                COUNT(DISTINCT DATE(created_at)) as days_active,
                                MAX(created_at) as last_request
                            FROM api_requests
                            WHERE api_key_id = ?
                        ");
                        $stmt->execute([$key['key_name']]);
                        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
                    } catch (Exception $e) {
                        // Table doesn't exist or other error - return empty stats
                        $stats = [
                            'total_requests' => 0,
                            'days_active' => 0,
                            'last_request' => null
                        ];
                    }

                    $key['usage_stats'] = $stats;
                    $key['permissions'] = json_decode($key['permissions'], true);
                }

                Response::success($keys, 'API keys retrieved successfully');
            }
            break;

        case 'POST':
            // Create new API key
            $data = Request::json();

            if (!$data) {
                Response::error('Invalid request data. JSON body required.', 400);
            }

            $keyName = $data['name'] ?? 'Untitled API Key';
            $permissions = $data['permissions'] ?? ['read'];
            $rateLimit = intval($data['rate_limit'] ?? 1000);
            $notes = $data['notes'] ?? null;

            // Validate key name
            if (empty(trim($keyName))) {
                Response::error('API key name is required', 400);
            }

            // Validate permissions
            $validPermissions = ['read', 'write', 'admin'];
            $permissions = array_intersect($permissions, $validPermissions);
            if (empty($permissions)) {
                $permissions = ['read'];
            }

            // Generate secure API key
            $apiKey = bin2hex(random_bytes(32)); // 64 character hex string
            $keyHash = hash('sha256', $apiKey);

            // Insert into database
            try {
                $stmt = $db->prepare("
                    INSERT INTO api_keys (key_hash, key_name, permissions, rate_limit, active, notes, created_by)
                    VALUES (?, ?, ?, ?, 1, ?, ?)
                ");
                $stmt->execute([
                    $keyHash,
                    $keyName,
                    json_encode($permissions),
                    $rateLimit,
                    $notes,
                    $keyConfig['name'] ?? 'System'
                ]);

                $keyId = $db->lastInsertId();

                if (!$keyId) {
                    throw new Exception('Failed to insert API key into database');
                }
            } catch (PDOException $e) {
                error_log("API Key Insert Error: " . $e->getMessage());
                Response::error('Failed to create API key: ' . $e->getMessage(), 500);
            } catch (Exception $e) {
                error_log("API Key Insert Error: " . $e->getMessage());
                Response::error('Failed to create API key: ' . $e->getMessage(), 500);
            }

            // Also add to config.php for immediate use (optional - don't fail if can't write)
            $configFile = __DIR__ . '/config.php';
            if (file_exists($configFile) && is_writable($configFile)) {
                try {
                    $configContent = file_get_contents($configFile);

                    // Add new key to API_V1_KEYS array
                    $newKeyEntry = "\n    '$apiKey' => [\n        'name' => '$keyName',\n        'permissions' => " . var_export($permissions, true) . ",\n        'rate_limit' => $rateLimit,\n        'active' => true\n    ],";

                    // Find the closing bracket of API_V1_KEYS array
                    if (preg_match("/(API_V1_KEYS\s*=\s*\[)(.*?)(\];)/s", $configContent, $matches)) {
                        $configContent = str_replace(
                            $matches[0],
                            $matches[1] . $matches[2] . $newKeyEntry . "\n" . $matches[3],
                            $configContent
                        );
                        file_put_contents($configFile, $configContent);
                    }
                } catch (Exception $e) {
                    // Log but don't fail - key is already in database
                    error_log("Warning: Could not update config.php: " . $e->getMessage());
                }
            }

            Response::created([
                'id' => $keyId,
                'api_key' => $apiKey, // Only shown once on creation
                'key_name' => $keyName,
                'permissions' => $permissions,
                'rate_limit' => $rateLimit,
                'notes' => $notes,
                'warning' => 'Save this API key immediately. It will not be shown again.'
            ], 'API key created successfully');
            break;

        case 'PUT':
        case 'PATCH':
            // Update API key
            $data = Request::json();
            $keyId = Request::query('id') ?? $data['id'] ?? null;

            if (!$keyId) {
                Response::error('API key ID is required', 400);
            }

            $updates = [];
            $params = [];

            if (isset($data['name'])) {
                $updates[] = "key_name = ?";
                $params[] = $data['name'];
            }

            if (isset($data['permissions'])) {
                $validPermissions = ['read', 'write', 'admin'];
                $permissions = array_intersect($data['permissions'], $validPermissions);
                if (!empty($permissions)) {
                    $updates[] = "permissions = ?";
                    $params[] = json_encode($permissions);
                }
            }

            if (isset($data['rate_limit'])) {
                $updates[] = "rate_limit = ?";
                $params[] = intval($data['rate_limit']);
            }

            if (isset($data['active'])) {
                $updates[] = "active = ?";
                $params[] = $data['active'] ? 1 : 0;
            }

            if (isset($data['notes'])) {
                $updates[] = "notes = ?";
                $params[] = $data['notes'];
            }

            if (empty($updates)) {
                Response::error('No fields to update', 400);
            }

            $params[] = $keyId;

            $stmt = $db->prepare("
                UPDATE api_keys
                SET " . implode(', ', $updates) . ", updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute($params);

            Response::success(null, 'API key updated successfully');
            break;

        case 'DELETE':
            // Delete API key
            $keyId = Request::query('id');

            if (!$keyId) {
                Response::error('API key ID is required', 400);
            }

            // Get key hash before deleting
            $stmt = $db->prepare("SELECT key_hash FROM api_keys WHERE id = ?");
            $stmt->execute([$keyId]);
            $key = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$key) {
                Response::notFound('API key not found');
            }

            // Delete from database
            $stmt = $db->prepare("DELETE FROM api_keys WHERE id = ?");
            $stmt->execute([$keyId]);

            Response::success(null, 'API key deleted successfully');
            break;

        default:
            Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("API Keys Error: " . $e->getMessage());
    error_log("API Keys Error Stack: " . $e->getTraceAsString());
    Response::error('Internal server error: ' . $e->getMessage(), 500);
}

