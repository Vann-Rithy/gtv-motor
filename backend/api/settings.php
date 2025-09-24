<?php
/**
 * Settings API
 * GTV Motor PHP Backend
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/Auth.php';

try {
    $auth = new Auth();
    $user = $auth->requireAuth();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $method = Request::method();
    
    if ($method === 'GET') {
        // Get company settings
        $stmt = $db->prepare("SELECT * FROM company_settings ORDER BY id DESC LIMIT 1");
        $stmt->execute();
        $companySettings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get system configuration
        $stmt = $db->prepare("SELECT * FROM system_config ORDER BY config_key");
        $stmt->execute();
        $systemConfig = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get notification settings
        $stmt = $db->prepare("SELECT * FROM notification_settings ORDER BY setting_key");
        $stmt->execute();
        $notificationSettings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $settings = [
            'company' => $companySettings,
            'system' => $systemConfig,
            'notifications' => $notificationSettings
        ];
        
        Response::success($settings, 'Settings retrieved successfully');
        
    } elseif ($method === 'POST') {
        // Update settings
        $data = Request::body();
        $settingsType = Request::query('type') ?? 'company';
        
        if ($settingsType === 'company') {
            // Update company settings
            $companyName = Request::sanitize($data['company_name'] ?? '');
            $address = Request::sanitize($data['address'] ?? '');
            $phone = Request::sanitize($data['phone'] ?? '');
            $email = Request::sanitize($data['email'] ?? '');
            $taxId = Request::sanitize($data['tax_id'] ?? '');
            $logoUrl = Request::sanitize($data['logo_url'] ?? '');
            $website = Request::sanitize($data['website'] ?? '');
            $businessHours = Request::sanitize($data['business_hours'] ?? '');
            
            $stmt = $db->prepare("
                INSERT INTO company_settings (
                    company_name, address, phone, email, tax_id, logo_url, website, business_hours, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                    company_name = VALUES(company_name),
                    address = VALUES(address),
                    phone = VALUES(phone),
                    email = VALUES(email),
                    tax_id = VALUES(tax_id),
                    logo_url = VALUES(logo_url),
                    website = VALUES(website),
                    business_hours = VALUES(business_hours),
                    updated_at = NOW()
            ");
            
            $stmt->execute([$companyName, $address, $phone, $email, $taxId, $logoUrl, $website, $businessHours]);
            
        } elseif ($settingsType === 'system') {
            // Update system configuration
            if (!empty($data['config'])) {
                foreach ($data['config'] as $key => $value) {
                    $stmt = $db->prepare("
                        INSERT INTO system_config (config_key, config_value, updated_at)
                        VALUES (?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                            config_value = VALUES(config_value),
                            updated_at = NOW()
                    ");
                    $stmt->execute([$key, $value]);
                }
            }
            
        } elseif ($settingsType === 'notifications') {
            // Update notification settings
            if (!empty($data['notifications'])) {
                foreach ($data['notifications'] as $key => $value) {
                    $stmt = $db->prepare("
                        INSERT INTO notification_settings (setting_key, setting_value, updated_at)
                        VALUES (?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                            setting_value = VALUES(setting_value),
                            updated_at = NOW()
                    ");
                    $stmt->execute([$key, $value ? 1 : 0]);
                }
            }
        }
        
        Response::success(null, 'Settings updated successfully');
        
    } else {
        Response::error('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log("Settings API error: " . $e->getMessage());
    Response::error('Failed to process settings request', 500);
}
?>
