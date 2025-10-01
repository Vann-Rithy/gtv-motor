<?php
/**
 * Notifications API
 * GTV Motor PHP Backend - Updated for Token Authentication
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Request.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    // No authentication required - Developer Mode
    require_once __DIR__ . '/../config/database.php';
    $database = new Database();
    $db = $database->getConnection();

    $method = Request::method();

    if ($method === 'GET') {
        // Return empty notifications (table doesn't exist yet)
        Response::success([
            'notifications' => [],
            'counts' => [
                'total' => 0,
                'high_priority' => 0,
                'medium_priority' => 0,
                'low_priority' => 0,
                'service_due' => 0,
                'warranty_expiring' => 0,
                'follow_up' => 0
            ]
        ], 'Notifications retrieved successfully');

    } elseif ($method === 'POST') {
        // Notifications table doesn't exist yet
        Response::error('Notifications feature not implemented yet', 501);

    } elseif ($method === 'PUT') {
        // Notifications table doesn't exist yet
        Response::error('Notifications feature not implemented yet', 501);

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Notifications API Error: " . $e->getMessage());
    Response::error('Internal server error', 500);
}
?>