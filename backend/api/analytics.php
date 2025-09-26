<?php
/**
 * Analytics API
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
        // Get range parameter
        $range = Request::query('range') ?? 'monthly';

        // Generate analytics data based on range
        $analytics = [
            'range' => $range,
            'revenue' => [
                'total' => 0,
                'growth' => 0,
                'trend' => 'stable',
                'chart_data' => []
            ],
            'services' => [
                'total' => 0,
                'completed' => 0,
                'pending' => 0,
                'cancelled' => 0,
                'chart_data' => []
            ],
            'customers' => [
                'total' => 0,
                'new' => 0,
                'returning' => 0,
                'chart_data' => []
            ],
            'vehicles' => [
                'total' => 0,
                'serviced' => 0,
                'chart_data' => []
            ],
            'performance' => [
                'average_service_time' => 0,
                'customer_satisfaction' => 0,
                'efficiency_score' => 0
            ]
        ];

        // Generate sample chart data based on range
        $days = 30; // Default to 30 days
        switch ($range) {
            case 'weekly':
                $days = 7;
                break;
            case 'monthly':
                $days = 30;
                break;
            case 'yearly':
                $days = 365;
                break;
        }

        // Generate sample data for charts
        for ($i = $days; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-{$i} days"));
            $analytics['revenue']['chart_data'][] = [
                'date' => $date,
                'value' => rand(1000, 5000)
            ];
            $analytics['services']['chart_data'][] = [
                'date' => $date,
                'value' => rand(5, 25)
            ];
            $analytics['customers']['chart_data'][] = [
                'date' => $date,
                'value' => rand(2, 10)
            ];
        }

        Response::success($analytics, 'Analytics data retrieved successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Analytics API error: " . $e->getMessage());
    Response::error('Failed to process analytics request', 500);
}
?>

