<?php
/**
 * Settings API
 * GTV Motor PHP Backend - Updated for Token Authentication
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/Request.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    // No authentication required - Developer Mode

    // Check if Request class exists
    if (!class_exists('Request')) {
        throw new Exception('Request class not found');
    }

    $method = Request::method();

    // Initialize database connection
    try {
        $database = new Database();
        $db = $database->getConnection();
    } catch (Exception $e) {
        error_log("Settings API - Database connection error: " . $e->getMessage());
        Response::error('Database connection failed', 500);
        exit;
    }

    if ($method === 'GET') {
        // Get settings type from URL path or query parameter
        $settingsType = Request::query('type');

        if (!$settingsType) {
            // Try to get from URL path
        $uri = $_SERVER['REQUEST_URI'];
        $pathParts = explode('/', trim(parse_url($uri, PHP_URL_PATH), '/'));

        // Find 'settings' in the path and get the next part
        for ($i = 0; $i < count($pathParts) - 1; $i++) {
            if ($pathParts[$i] === 'settings') {
                    $settingsType = $pathParts[$i + 1] ?? null;
                break;
                }
            }
        }

        switch ($settingsType) {
            case 'company':
                $settings = [
                    'company_name' => 'GTV Motor',
                    'address' => '123 Main Street, City, Country',
                    'phone' => '+1234567890',
                    'email' => 'info@gtvmotor.com',
                    'website' => 'https://gtvmotor.dev',
                    'tax_id' => 'TAX123456789',
                    'logo' => null
                ];
                break;

            case 'system':
                $settings = [
                    'timezone' => 'Asia/Phnom_Penh',
                    'date_format' => 'Y-m-d',
                    'time_format' => 'H:i:s',
                    'currency' => 'USD',
                    'language' => 'en',
                    'maintenance_mode' => false,
                    'auto_backup' => true
                ];
                break;

            case 'notifications':
                $settings = [
                    'email_notifications' => true,
                    'sms_notifications' => false,
                    'push_notifications' => true,
                    'service_reminders' => true,
                    'warranty_alerts' => true,
                    'follow_up_reminders' => true,
                    'marketing_emails' => false
                ];
                break;

            case 'api':
                // Get API settings from database
                try {
                    // Check if table exists
                    $tableCheck = $db->query("SHOW TABLES LIKE 'system_config'");
                    if ($tableCheck->rowCount() === 0) {
                        // Table doesn't exist, return defaults
                        $settings = [
                            'baseUrl' => 'https://api.gtvmotor.dev/api/v1',
                            'apiKey' => '',
                            'timeout' => '30000',
                            'retryAttempts' => '3',
                            'cacheDuration' => '300',
                            'enableCaching' => true
                        ];
                        break;
                    }

                    $stmt = $db->prepare("
                        SELECT config_key, config_value, config_type
                        FROM system_config
                        WHERE config_key LIKE 'api_%'
                    ");
                    $stmt->execute();
                    $configs = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    $apiSettings = [];
                    foreach ($configs as $config) {
                        $key = str_replace('api_', '', $config['config_key']);
                        $value = $config['config_value'];

                        // Convert based on type
                        switch ($config['config_type']) {
                            case 'number':
                                $value = (int)$value;
                                break;
                            case 'boolean':
                                $value = $value === 'true' || $value === '1';
                                break;
                        }

                        $apiSettings[$key] = $value;
                    }

                    // Format for frontend
                    $settings = [
                        'baseUrl' => $apiSettings['base_url'] ?? 'https://api.gtvmotor.dev/api/v1',
                        'apiKey' => $apiSettings['key'] ?? '',
                        'timeout' => (string)($apiSettings['timeout'] ?? 30000),
                        'retryAttempts' => (string)($apiSettings['retry_attempts'] ?? 3),
                        'cacheDuration' => (string)($apiSettings['cache_duration'] ?? 300),
                        'enableCaching' => $apiSettings['enable_caching'] ?? true
                    ];
                } catch (PDOException $e) {
                    error_log("Settings API - Database query error: " . $e->getMessage());
                    // Return defaults if database query fails
                    $settings = [
                        'baseUrl' => 'https://api.gtvmotor.dev/api/v1',
                        'apiKey' => '',
                        'timeout' => '30000',
                        'retryAttempts' => '3',
                        'cacheDuration' => '300',
                        'enableCaching' => true
                    ];
                }
                break;

            default:
                // Return all settings
                $settings = [
                    'company' => [
                        'company_name' => 'GTV Motor',
                        'address' => '123 Main Street, City, Country',
                        'phone' => '+1234567890',
                        'email' => 'info@gtvmotor.com',
                        'website' => 'https://gtvmotor.dev',
                        'tax_id' => 'TAX123456789',
                        'logo' => null
                    ],
                    'system' => [
                        'timezone' => 'Asia/Phnom_Penh',
                        'date_format' => 'Y-m-d',
                        'time_format' => 'H:i:s',
                        'currency' => 'USD',
                        'language' => 'en',
                        'maintenance_mode' => false,
                        'auto_backup' => true
                    ],
                    'notifications' => [
                        'email_notifications' => true,
                        'sms_notifications' => false,
                        'push_notifications' => true,
                        'service_reminders' => true,
                        'warranty_alerts' => true,
                        'follow_up_reminders' => true,
                        'marketing_emails' => false
                    ]
                ];
                break;
        }

        Response::success($settings, 'Settings retrieved successfully');

    } elseif ($method === 'POST' || $method === 'PUT') {
        // Save settings
        $uri = $_SERVER['REQUEST_URI'];
        $pathParts = explode('/', trim(parse_url($uri, PHP_URL_PATH), '/'));

        $settingsType = null;
        for ($i = 0; $i < count($pathParts) - 1; $i++) {
            if ($pathParts[$i] === 'settings') {
                $settingsType = $pathParts[$i + 1] ?? Request::query('type');
                break;
            }
        }

        if (!$settingsType) {
            $settingsType = Request::query('type');
        }

        $data = Request::body();

        if ($settingsType === 'api') {
            // Save API settings to database
            try {
                // Check if table exists, create if not
                $tableCheck = $db->query("SHOW TABLES LIKE 'system_config'");
                if ($tableCheck->rowCount() === 0) {
                    // Create table if it doesn't exist
                    $createTable = "
                        CREATE TABLE IF NOT EXISTS `system_config` (
                            `id` int(11) NOT NULL AUTO_INCREMENT,
                            `config_key` varchar(255) NOT NULL,
                            `config_value` text DEFAULT NULL,
                            `config_type` varchar(50) DEFAULT 'string',
                            `description` text DEFAULT NULL,
                            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            PRIMARY KEY (`id`),
                            UNIQUE KEY `config_key` (`config_key`)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
                    ";
                    $db->exec($createTable);
                }

                $settingsMap = [
                    'baseUrl' => 'api_base_url',
                    'apiKey' => 'api_key',
                    'timeout' => 'api_timeout',
                    'retryAttempts' => 'api_retry_attempts',
                    'cacheDuration' => 'api_cache_duration',
                    'enableCaching' => 'api_enable_caching'
                ];

                foreach ($settingsMap as $frontendKey => $dbKey) {
                    if (isset($data[$frontendKey])) {
                        $value = $data[$frontendKey];
                        $type = 'string';

                        // Determine type
                        if ($dbKey === 'api_timeout' || $dbKey === 'api_retry_attempts' || $dbKey === 'api_cache_duration') {
                            $type = 'number';
                        } elseif ($dbKey === 'api_enable_caching') {
                            $type = 'boolean';
                            $value = $value ? 'true' : 'false';
                        }

                        // Update or insert
                        $stmt = $db->prepare("
                            INSERT INTO system_config (config_key, config_value, config_type, updated_at)
                            VALUES (?, ?, ?, NOW())
                            ON DUPLICATE KEY UPDATE
                                config_value = VALUES(config_value),
                                config_type = VALUES(config_type),
                                updated_at = NOW()
                        ");
                        $stmt->execute([$dbKey, (string)$value, $type]);
                    }
                }

                Response::success([
                    'baseUrl' => $data['baseUrl'] ?? 'https://api.gtvmotor.dev/api/v1',
                    'apiKey' => $data['apiKey'] ?? '',
                    'timeout' => $data['timeout'] ?? 30000,
                    'retryAttempts' => $data['retryAttempts'] ?? 3,
                    'cacheDuration' => $data['cacheDuration'] ?? 300,
                    'enableCaching' => $data['enableCaching'] ?? true
                ], 'API settings saved successfully');
            } catch (PDOException $e) {
                error_log("Settings API - Save error: " . $e->getMessage());
                Response::error('Failed to save API settings: ' . $e->getMessage(), 500);
            }
        } else {
            Response::error('Settings type not supported for saving', 400);
        }

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Settings API error: " . $e->getMessage());
    error_log("Settings API error trace: " . $e->getTraceAsString());

    // Make sure Response class exists before using it
    if (class_exists('Response')) {
        Response::error('Failed to process settings request: ' . $e->getMessage(), 500);
    } else {
        // Fallback if Response class doesn't exist
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => 'Failed to process settings request: ' . $e->getMessage()
        ]);
    }
}
?>