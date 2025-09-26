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

    $method = Request::method();

    if ($method === 'GET') {
        // Get notification counts - simplified for now
        $notifications = [
            'counts' => [
                'total_alerts' => 0,
                'pending_alerts' => 0,
                'sent_alerts' => 0,
                'completed_alerts' => 0,
                'overdue_alerts' => 0,
                'due_today_alerts' => 0,
                'due_soon_alerts' => 0,
                'service_due_alerts' => 0,
                'warranty_alerts' => 0,
                'follow_up_alerts' => 0
            ],
            'recent_alerts' => []
        ];

        Response::success($notifications, 'Notifications retrieved successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Notifications API error: " . $e->getMessage());
    Response::error('Failed to process notifications request', 500);
}
?>
