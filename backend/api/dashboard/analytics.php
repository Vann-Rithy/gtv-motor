<?php
/**
 * Dashboard Analytics API
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

        if (!$payload || !isset($payload['user_id'])) {
            Response::unauthorized('Invalid token format');
        }

        // No expiration check - token never expires for user-friendly experience

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

    $timeRange = Request::query('range') ?? 'monthly';
    $fromDate = Request::query('from') ?? date('Y-m-01'); // First day of current month
    $toDate = Request::query('to') ?? date('Y-m-d'); // Today

    $data = [];

    if ($timeRange === 'daily') {
        // Get daily data for the current week
        $data = getDailyData($db, $fromDate, $toDate);
    } elseif ($timeRange === 'monthly') {
        // Get monthly data for the current year
        $data = getMonthlyData($db, $fromDate, $toDate);
    } elseif ($timeRange === 'yearly') {
        // Get yearly data for the last 5 years
        $data = getYearlyData($db, $fromDate, $toDate);
    } else {
        // Default to monthly
        $data = getMonthlyData($db, $fromDate, $toDate);
    }

    Response::success($data, 'Analytics data retrieved successfully');

} catch (Exception $e) {
    error_log("Dashboard analytics API error: " . $e->getMessage());
    Response::error('Failed to retrieve analytics data', 500);
}

function getDailyData($db, $fromDate, $toDate) {
    // Daily revenue
    $stmt = $db->prepare("
        SELECT
            DATE(service_date) as date,
            COALESCE(SUM(total_amount), 0) as revenue,
            COUNT(*) as services
        FROM services
        WHERE DATE(service_date) BETWEEN ? AND ?
        AND service_status = 'completed'
        GROUP BY DATE(service_date)
        ORDER BY date
    ");
    $stmt->execute([$fromDate, $toDate]);
    $dailyRevenue = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Services by type (daily)
    $stmt = $db->prepare("
        SELECT
            DATE(s.service_date) as date,
            COALESCE(st.service_type_name, 'Unknown') as service_type,
            COUNT(*) as count,
            COALESCE(SUM(s.total_amount), 0) as revenue
        FROM services s
        LEFT JOIN service_types st ON s.service_type_id = st.id
        WHERE DATE(s.service_date) BETWEEN ? AND ?
        GROUP BY DATE(s.service_date), st.service_type_name
        ORDER BY date, count DESC
    ");
    $stmt->execute([$fromDate, $toDate]);
    $servicesByType = $stmt->fetchAll(PDO::FETCH_ASSOC);

    return [
        'daily_revenue' => $dailyRevenue,
        'services_by_type' => $servicesByType,
        'period' => 'daily',
        'from_date' => $fromDate,
        'to_date' => $toDate
    ];
}

function getMonthlyData($db, $fromDate, $toDate) {
    // Monthly revenue
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
    $monthlyRevenue = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Services by type (monthly)
    $stmt = $db->prepare("
        SELECT
            DATE_FORMAT(s.service_date, '%Y-%m') as month,
            COALESCE(st.service_type_name, 'Unknown') as service_type,
            COUNT(*) as count,
            COALESCE(SUM(s.total_amount), 0) as revenue
        FROM services s
        LEFT JOIN service_types st ON s.service_type_id = st.id
        WHERE DATE(s.service_date) BETWEEN ? AND ?
        GROUP BY DATE_FORMAT(s.service_date, '%Y-%m'), st.service_type_name
        ORDER BY month, count DESC
    ");
    $stmt->execute([$fromDate, $toDate]);
    $servicesByType = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Customer growth
    $stmt = $db->prepare("
        SELECT
            DATE_FORMAT(created_at, '%Y-%m') as month,
            COUNT(*) as new_customers
        FROM customers
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month
    ");
    $stmt->execute([$fromDate, $toDate]);
    $customerGrowth = $stmt->fetchAll(PDO::FETCH_ASSOC);

    return [
        'monthly_revenue' => $monthlyRevenue,
        'services_by_type' => $servicesByType,
        'customer_growth' => $customerGrowth,
        'period' => 'monthly',
        'from_date' => $fromDate,
        'to_date' => $toDate
    ];
}

function getYearlyData($db, $fromDate, $toDate) {
    // Yearly revenue
    $stmt = $db->prepare("
        SELECT
            YEAR(service_date) as year,
            COALESCE(SUM(total_amount), 0) as revenue,
            COUNT(*) as services
        FROM services
        WHERE DATE(service_date) BETWEEN ? AND ?
        AND service_status = 'completed'
        GROUP BY YEAR(service_date)
        ORDER BY year
    ");
    $stmt->execute([$fromDate, $toDate]);
    $yearlyRevenue = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Services by type (yearly)
    $stmt = $db->prepare("
        SELECT
            YEAR(s.service_date) as year,
            COALESCE(st.service_type_name, 'Unknown') as service_type,
            COUNT(*) as count,
            COALESCE(SUM(s.total_amount), 0) as revenue
        FROM services s
        LEFT JOIN service_types st ON s.service_type_id = st.id
        WHERE DATE(s.service_date) BETWEEN ? AND ?
        GROUP BY YEAR(s.service_date), st.service_type_name
        ORDER BY year, count DESC
    ");
    $stmt->execute([$fromDate, $toDate]);
    $servicesByType = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Customer growth (yearly)
    $stmt = $db->prepare("
        SELECT
            YEAR(created_at) as year,
            COUNT(*) as new_customers
        FROM customers
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY YEAR(created_at)
        ORDER BY year
    ");
    $stmt->execute([$fromDate, $toDate]);
    $customerGrowth = $stmt->fetchAll(PDO::FETCH_ASSOC);

    return [
        'yearly_revenue' => $yearlyRevenue,
        'services_by_type' => $servicesByType,
        'customer_growth' => $customerGrowth,
        'period' => 'yearly',
        'from_date' => $fromDate,
        'to_date' => $toDate
    ];
}
?>
