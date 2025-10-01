<?php
/**
 * Dashboard Analytics API
 * GTV Motor PHP Backend - Updated for Token Authentication
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/Request.php';
require_once __DIR__ . '/../../includes/Response.php';

try {
    // No authentication required - Developer Mode
    require_once __DIR__ . '/../../config/database.php';
    $database = new Database();
    $db = $database->getConnection();

    $timeRange = Request::query('range') ?? 'monthly';

    // Set appropriate date ranges based on time range
    if ($timeRange === 'daily') {
        $fromDate = Request::query('from') ?? date('Y-m-d', strtotime('-7 days')); // Last 7 days
        $toDate = Request::query('to') ?? date('Y-m-d'); // Today
    } elseif ($timeRange === 'monthly') {
        $fromDate = Request::query('from') ?? date('Y-m-01', strtotime('-12 months')); // Last 12 months
        $toDate = Request::query('to') ?? date('Y-m-d'); // Today
    } else { // yearly
        $fromDate = Request::query('from') ?? date('Y-01-01', strtotime('-5 years')); // Last 5 years
        $toDate = Request::query('to') ?? date('Y-m-d'); // Today
    }

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

    // Transform data for frontend
    $transformedRevenue = array_map(function($item) {
        return [
            'period' => $item['month'],
            'revenue' => (float)$item['revenue'],
            'services' => (int)$item['services']
        ];
    }, $monthlyRevenue);

    $transformedServices = [];
    $serviceTypeMap = [];
    foreach ($servicesByType as $item) {
        $type = $item['service_type'];
        if (!isset($serviceTypeMap[$type])) {
            $serviceTypeMap[$type] = [
                'type' => $type,
                'count' => 0,
                'revenue' => 0,
                'color' => getServiceTypeColor($type)
            ];
        }
        $serviceTypeMap[$type]['count'] += (int)$item['count'];
        $serviceTypeMap[$type]['revenue'] += (float)$item['revenue'];
    }
    $transformedServices = array_values($serviceTypeMap);

    $transformedCustomers = array_map(function($item) {
        return [
            'period' => $item['month'],
            'new_customers' => (int)$item['new_customers'],
            'new' => (int)$item['new_customers'],
            'returning' => (int)($item['new_customers'] * 0.7) // Simulate returning customers
        ];
    }, $customerGrowth);

    return [
        'monthly_revenue' => $transformedRevenue,
        'services_by_type' => $transformedServices,
        'serviceTypes' => $transformedServices, // Alias for frontend compatibility
        'customer_growth' => $transformedCustomers,
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

function getServiceTypeColor($serviceType) {
    $colors = [
        'Oil Change' => '#3b82f6',
        'Basic Check Up' => '#10b981',
        'Brake Service' => '#f59e0b',
        'Engine Repair' => '#ef4444',
        'Transmission' => '#8b5cf6',
        'Tire Service' => '#06b6d4',
        'Battery Service' => '#84cc16',
        'AC Service' => '#f97316',
        'Electrical' => '#ec4899',
        'Other' => '#6b7280'
    ];

    return $colors[$serviceType] ?? '#6b7280';
}
?>
