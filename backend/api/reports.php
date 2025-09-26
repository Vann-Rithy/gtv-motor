<?php
/**
 * Reports API
 * GTV Motor PHP Backend - Token Authentication
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
        // Get report type from URL path
        $uri = $_SERVER['REQUEST_URI'];
        $pathParts = explode('/', trim(parse_url($uri, PHP_URL_PATH), '/'));

        // Find 'reports' in the path and get the next part
        $reportType = null;
        for ($i = 0; $i < count($pathParts) - 1; $i++) {
            if ($pathParts[$i] === 'reports') {
                $reportType = $pathParts[$i + 1];
                break;
            }
        }

        // Get date range from query parameters
        $from = Request::query('from') ?? date('Y-m-01'); // First day of current month
        $to = Request::query('to') ?? date('Y-m-d'); // Today

        switch ($reportType) {
            case 'summary':
                $report = [
                    'period' => ['from' => $from, 'to' => $to],
                    'total_services' => 0,
                    'total_revenue' => 0,
                    'total_customers' => 0,
                    'total_vehicles' => 0,
                    'completed_services' => 0,
                    'pending_services' => 0,
                    'average_service_value' => 0
                ];
                break;

            case 'warranty':
                $report = [
                    'period' => ['from' => $from, 'to' => $to],
                    'total_warranties' => 0,
                    'expiring_soon' => 0,
                    'expired' => 0,
                    'active_warranties' => 0,
                    'warranty_claims' => 0
                ];
                break;

            case 'customer':
                $report = [
                    'period' => ['from' => $from, 'to' => $to],
                    'total_customers' => 0,
                    'new_customers' => 0,
                    'returning_customers' => 0,
                    'top_customers' => [],
                    'customer_satisfaction' => 0
                ];
                break;

            case 'inventory':
                $report = [
                    'period' => ['from' => $from, 'to' => $to],
                    'total_items' => 0,
                    'low_stock_items' => 0,
                    'out_of_stock_items' => 0,
                    'total_value' => 0,
                    'fast_moving_items' => [],
                    'slow_moving_items' => []
                ];
                break;

            default:
                Response::error('Invalid report type', 400);
                return;
        }

        Response::success($report, ucfirst($reportType) . ' report generated successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Reports API error: " . $e->getMessage());
    Response::error('Failed to process reports request', 500);
}
?>

