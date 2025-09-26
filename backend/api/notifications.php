<?php
/**
 * Notifications API
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
