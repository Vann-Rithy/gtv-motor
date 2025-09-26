<?php
/**
 * Reports Summary API
 * GTV Motor PHP Backend - Updated for Token Authentication
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/Request.php';
require_once __DIR__ . '/../../includes/Response.php';

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

        if (!$payload || !isset($payload['user_id']) || !isset($payload['exp'])) {
            Response::unauthorized('Invalid token format');
        }

        // Check if token is expired
        if ($payload['exp'] < time()) {
            Response::unauthorized('Token expired');
        }

        // Get user from database
        require_once __DIR__ . '/../../config/database.php';
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

    $database = new Database();
    $db = $database->getConnection();

    $fromDate = Request::query('from') ?? '2024-01-01';
    $toDate = Request::query('to') ?? date('Y-m-d');

    // Get total revenue and services for the date range
    $stmt = $db->prepare("
        SELECT
            COUNT(*) as totalServices,
            COALESCE(SUM(total_amount), 0) as totalRevenue,
            COALESCE(AVG(total_amount), 0) as averageServiceValue
        FROM services
        WHERE DATE(service_date) BETWEEN ? AND ?
        AND service_status = 'completed'
    ");
    $stmt->execute([$fromDate, $toDate]);
    $revenueResult = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get services by type
    $stmt = $db->prepare("
        SELECT
            COALESCE(st.service_type_name, 'Unknown') as service_type_name,
            COUNT(*) as count,
            COALESCE(SUM(s.total_amount), 0) as revenue
        FROM services s
        LEFT JOIN service_types st ON s.service_type_id = st.id
        WHERE DATE(s.service_date) BETWEEN ? AND ?
        AND s.service_status = 'completed'
        GROUP BY COALESCE(st.service_type_name, 'Unknown')
        ORDER BY count DESC
    ");
    $stmt->execute([$fromDate, $toDate]);
    $servicesByType = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get monthly trends
    $stmt = $db->prepare("
        SELECT
            DATE_FORMAT(service_date, '%Y-%m') as month,
            COALESCE(SUM(total_amount), 0) as revenue,
            COUNT(*) as services
        FROM services
        WHERE DATE(service_date) BETWEEN ? AND ?
        AND service_status = 'completed'
        GROUP BY DATE_FORMAT(service_date, '%Y-%m')
        ORDER BY month
    ");
    $stmt->execute([$fromDate, $toDate]);
    $monthlyTrend = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get customer growth
    $stmt = $db->prepare("
        SELECT
            COUNT(DISTINCT customer_id) as currentCustomers,
            (
                SELECT COUNT(DISTINCT customer_id)
                FROM services
                WHERE DATE(service_date) < ?
            ) as previousCustomers
        FROM services
        WHERE DATE(service_date) BETWEEN ? AND ?
    ");
    $stmt->execute([$fromDate, $fromDate, $toDate]);
    $customerGrowth = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get top service
    $stmt = $db->prepare("
        SELECT
            COALESCE(st.service_type_name, 'Unknown') as service_type_name,
            COUNT(*) as count
        FROM services s
        LEFT JOIN service_types st ON s.service_type_id = st.id
        WHERE DATE(s.service_date) BETWEEN ? AND ?
        AND s.service_status = 'completed'
        GROUP BY COALESCE(st.service_type_name, 'Unknown')
        ORDER BY count DESC
        LIMIT 1
    ");
    $stmt->execute([$fromDate, $toDate]);
    $topService = $stmt->fetch(PDO::FETCH_ASSOC);

    // Calculate customer growth percentage
    $customerGrowthPercentage = 0;
    if ($customerGrowth['previousCustomers'] > 0) {
        $customerGrowthPercentage = (($customerGrowth['currentCustomers'] - $customerGrowth['previousCustomers']) / $customerGrowth['previousCustomers']) * 100;
    }

    $summaryData = [
        'total_revenue' => (float)$revenueResult['totalRevenue'],
        'total_services' => (int)$revenueResult['totalServices'],
        'average_service_value' => (float)$revenueResult['averageServiceValue'],
        'top_service' => $topService['service_type_name'] ?? 'N/A',
        'customer_growth' => round($customerGrowthPercentage, 2),
        'services_by_type' => array_map(function($service) {
            return [
                'type' => $service['service_type_name'],
                'count' => (int)$service['count'],
                'revenue' => (float)$service['revenue']
            ];
        }, $servicesByType),
        'monthly_trend' => array_map(function($month) {
            return [
                'month' => $month['month'],
                'revenue' => (float)$month['revenue'],
                'services' => (int)$month['services']
            ];
        }, $monthlyTrend),
        'period' => [
            'from' => $fromDate,
            'to' => $toDate
        ]
    ];

    Response::success($summaryData, 'Summary report generated successfully');

} catch (Exception $e) {
    error_log("Reports summary API error: " . $e->getMessage());
    Response::error('Failed to generate summary report', 500);
}
?>
