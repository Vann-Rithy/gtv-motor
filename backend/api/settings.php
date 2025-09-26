<?php
/**
 * Settings API
 * GTV Motor PHP Backend - Updated for Token Authentication
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Request.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    // Get token from URL parameter first, then Authorization header
    $token = $_GET['token'] ?? Request::authorization();

    if (!$token) {
        Response::unauthorized('No authorization token provided');
    }

    // Remove 'Bearer ' prefix if present
    $token = str_replace('Bearer ', '', $token);

    // Simple token validation (base64 encoded JSON)
    try {
        $payload = json_decode(base64_decode($token), true);

        if (!$payload || !isset($payload['user_id'])) {
            Response::unauthorized('Invalid token format');
        }

        // No expiration check - token never expires for user-friendly experience

        // Get user from database
        require_once __DIR__ . '/../config/database.php';
        $database = new Database();
        $conn = $database->getConnection();

        $stmt = $conn->prepare("
            SELECT u.*, s.name as staff_name, s.role as staff_role
            FROM users u
            LEFT JOIN staff s ON u.staff_id = s.id
            WHERE u.id = ? AND u.is_active = 1
        ");
        $stmt->execute([$payload['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            Response::unauthorized('User not found or inactive');
        }

    } catch (Exception $e) {
        Response::unauthorized('Invalid token');
    }

    $method = Request::method();

    if ($method === 'GET') {
        // Get settings type from URL path
        $uri = $_SERVER['REQUEST_URI'];
        $pathParts = explode('/', trim(parse_url($uri, PHP_URL_PATH), '/'));

        // Find 'settings' in the path and get the next part
        $settingsType = null;
        for ($i = 0; $i < count($pathParts) - 1; $i++) {
            if ($pathParts[$i] === 'settings') {
                $settingsType = $pathParts[$i + 1];
                break;
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

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Settings API error: " . $e->getMessage());
    Response::error('Failed to process settings request', 500);
}
?>