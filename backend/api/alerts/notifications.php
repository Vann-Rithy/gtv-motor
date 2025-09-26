<?php
/**
 * Alerts Notifications API
 * GTV Motor PHP Backend - No Authentication Required
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/Request.php';
require_once __DIR__ . '/../../includes/Response.php';

try {
    // No authentication required - Developer Mode
    require_once __DIR__ . '/../../config/database.php';
    $database = new Database();
    $db = $database->getConnection();

    $method = Request::method();

    if ($method === 'GET') {
        // Get notification counts and recent notifications
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

        // Get actual counts from database if possible
        try {
            $totalStmt = $db->query("SELECT COUNT(*) FROM alerts");
            $notifications['counts']['total_alerts'] = (int)$totalStmt->fetchColumn();

            $pendingStmt = $db->query("SELECT COUNT(*) FROM alerts WHERE status = 'pending'");
            $notifications['counts']['pending_alerts'] = (int)$pendingStmt->fetchColumn();

            $overdueStmt = $db->query("SELECT COUNT(*) FROM alerts WHERE due_date < CURDATE() AND status != 'completed'");
            $notifications['counts']['overdue_alerts'] = (int)$overdueStmt->fetchColumn();

            $dueTodayStmt = $db->query("SELECT COUNT(*) FROM alerts WHERE DATE(due_date) = CURDATE() AND status != 'completed'");
            $notifications['counts']['due_today_alerts'] = (int)$dueTodayStmt->fetchColumn();

            $dueSoonStmt = $db->query("SELECT COUNT(*) FROM alerts WHERE due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND status != 'completed'");
            $notifications['counts']['due_soon_alerts'] = (int)$dueSoonStmt->fetchColumn();

        } catch (Exception $e) {
            // If database queries fail, use default values
            error_log("Notification counts query failed: " . $e->getMessage());
        }

        Response::success($notifications, 'Notifications retrieved successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Notifications API error: " . $e->getMessage());
    Response::error('Failed to get notifications', 500);
}
?>
