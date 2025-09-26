<?php
/**
 * Settings API
 * GTV Motor PHP Backend - Updated for Token Authentication
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Request.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    // No authentication required - Developer Mode

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