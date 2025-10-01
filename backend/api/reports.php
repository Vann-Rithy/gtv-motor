<?php
/**
 * Reports API
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
                // Get summary statistics
                $summaryQuery = "
                    SELECT
                        COUNT(DISTINCT s.id) as total_services,
                        COALESCE(SUM(s.total_amount), 0) as total_revenue,
                        COUNT(DISTINCT s.customer_id) as total_customers,
                        COUNT(DISTINCT s.vehicle_id) as total_vehicles,
                        SUM(CASE WHEN s.service_status = 'completed' THEN 1 ELSE 0 END) as completed_services,
                        SUM(CASE WHEN s.service_status = 'pending' THEN 1 ELSE 0 END) as pending_services,
                        COALESCE(AVG(s.total_amount), 0) as average_service_value
                    FROM services s
                    WHERE s.service_date BETWEEN :from_date AND :to_date
                ";
                $summaryStmt = $db->prepare($summaryQuery);
                $summaryStmt->bindParam(':from_date', $from);
                $summaryStmt->bindParam(':to_date', $to);
                $summaryStmt->execute();
                $summaryData = $summaryStmt->fetch(PDO::FETCH_ASSOC);

                // Get services by type
                $servicesByTypeQuery = "
                    SELECT
                        st.service_type_name as type,
                        COUNT(s.id) as count,
                        COALESCE(SUM(s.total_amount), 0) as revenue
                    FROM services s
                    LEFT JOIN service_types st ON s.service_type_id = st.id
                    WHERE s.service_date BETWEEN :from_date AND :to_date
                    GROUP BY st.service_type_name
                    ORDER BY count DESC
                ";
                $servicesByTypeStmt = $db->prepare($servicesByTypeQuery);
                $servicesByTypeStmt->bindParam(':from_date', $from);
                $servicesByTypeStmt->bindParam(':to_date', $to);
                $servicesByTypeStmt->execute();
                $servicesByType = $servicesByTypeStmt->fetchAll(PDO::FETCH_ASSOC);

                // Get monthly trend
                $monthlyTrendQuery = "
                    SELECT
                        DATE_FORMAT(service_date, '%Y-%m') as month,
                        COALESCE(SUM(total_amount), 0) as revenue,
                        COUNT(*) as services
                    FROM services
                    WHERE service_date BETWEEN :from_date AND :to_date
                    GROUP BY DATE_FORMAT(service_date, '%Y-%m')
                    ORDER BY month
                ";
                $monthlyTrendStmt = $db->prepare($monthlyTrendQuery);
                $monthlyTrendStmt->bindParam(':from_date', $from);
                $monthlyTrendStmt->bindParam(':to_date', $to);
                $monthlyTrendStmt->execute();
                $monthlyTrend = $monthlyTrendStmt->fetchAll(PDO::FETCH_ASSOC);

                $report = [
                    'period' => ['from' => $from, 'to' => $to],
                    'totalRevenue' => (float)$summaryData['total_revenue'],
                    'totalServices' => (int)$summaryData['total_services'],
                    'totalCustomers' => (int)$summaryData['total_customers'],
                    'totalVehicles' => (int)$summaryData['total_vehicles'],
                    'completedServices' => (int)$summaryData['completed_services'],
                    'pendingServices' => (int)$summaryData['pending_services'],
                    'averageServiceValue' => (float)$summaryData['average_service_value'],
                    'topService' => !empty($servicesByType) ? $servicesByType[0]['type'] : 'N/A',
                    'customerGrowth' => 0, // Calculate based on previous period
                    'servicesByType' => $servicesByType,
                    'monthlyTrend' => $monthlyTrend
                ];
                break;

            case 'warranty':
                // Get warranty statistics
                $warrantyQuery = "
                    SELECT
                        COUNT(*) as total_warranties,
                        SUM(CASE WHEN end_date >= CURDATE() THEN 1 ELSE 0 END) as active_warranties,
                        SUM(CASE WHEN end_date < CURDATE() THEN 1 ELSE 0 END) as expired_warranties,
                        SUM(CASE WHEN end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring_soon,
                        COALESCE(SUM(warranty_cost_covered), 0) as total_cost_covered
                    FROM warranties
                    WHERE start_date BETWEEN :from_date AND :to_date
                ";
                $warrantyStmt = $db->prepare($warrantyQuery);
                $warrantyStmt->bindParam(':from_date', $from);
                $warrantyStmt->bindParam(':to_date', $to);
                $warrantyStmt->execute();
                $warrantyData = $warrantyStmt->fetch(PDO::FETCH_ASSOC);

                // Get warranty claims (simplified - using services as claims)
                $claimsQuery = "
                    SELECT
                        s.service_date as claim_date,
                        CONCAT('Service: ', st.service_type_name) as description,
                        s.total_amount as amount,
                        CASE WHEN s.service_status = 'completed' THEN 'approved' ELSE 'pending' END as status,
                        c.name as customer_name,
                        v.plate_number as vehicle_plate,
                        w.start_date as warranty_start,
                        w.end_date as warranty_end
                    FROM services s
                    LEFT JOIN customers c ON s.customer_id = c.id
                    LEFT JOIN vehicles v ON s.vehicle_id = v.id
                    LEFT JOIN warranties w ON v.id = w.vehicle_id
                    LEFT JOIN service_types st ON s.service_type_id = st.id
                    WHERE s.service_date BETWEEN :from_date AND :to_date
                    AND w.id IS NOT NULL
                    ORDER BY s.service_date DESC
                    LIMIT 20
                ";
                $claimsStmt = $db->prepare($claimsQuery);
                $claimsStmt->bindParam(':from_date', $from);
                $claimsStmt->bindParam(':to_date', $to);
                $claimsStmt->execute();
                $claims = $claimsStmt->fetchAll(PDO::FETCH_ASSOC);

                $report = [
                    'period' => ['from' => $from, 'to' => $to],
                    'summary' => [
                        'totalWarranties' => (int)$warrantyData['total_warranties'],
                        'activeWarranties' => (int)$warrantyData['active_warranties'],
                        'expiredWarranties' => (int)$warrantyData['expired_warranties'],
                        'expiringSoon' => (int)$warrantyData['expiring_soon'],
                        'totalCostCovered' => (float)$warrantyData['total_cost_covered']
                    ],
                    'claims' => $claims
                ];
                break;

            case 'customer':
                // Get customer statistics
                $customerQuery = "
                    SELECT
                        COUNT(DISTINCT c.id) as total_customers,
                        COUNT(DISTINCT CASE WHEN s.service_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) THEN c.id END) as active_customers,
                        COALESCE(AVG(s.total_amount), 0) as average_service_value
                    FROM customers c
                    LEFT JOIN services s ON c.id = s.customer_id
                    WHERE c.created_at BETWEEN :from_date AND :to_date
                ";
                $customerStmt = $db->prepare($customerQuery);
                $customerStmt->bindParam(':from_date', $from);
                $customerStmt->bindParam(':to_date', $to);
                $customerStmt->execute();
                $customerData = $customerStmt->fetch(PDO::FETCH_ASSOC);

                // Get top customers
                $topCustomersQuery = "
                    SELECT
                        c.name,
                        c.phone,
                        c.email,
                        COUNT(s.id) as total_services,
                        COALESCE(SUM(s.total_amount), 0) as total_spent,
                        COALESCE(AVG(s.total_amount), 0) as average_service_cost,
                        MAX(s.service_date) as last_service_date
                    FROM customers c
                    LEFT JOIN services s ON c.id = s.customer_id
                    WHERE s.service_date BETWEEN :from_date AND :to_date
                    GROUP BY c.id, c.name, c.phone, c.email
                    ORDER BY total_spent DESC
                    LIMIT 10
                ";
                $topCustomersStmt = $db->prepare($topCustomersQuery);
                $topCustomersStmt->bindParam(':from_date', $from);
                $topCustomersStmt->bindParam(':to_date', $to);
                $topCustomersStmt->execute();
                $topCustomers = $topCustomersStmt->fetchAll(PDO::FETCH_ASSOC);

                // Get repeat customers
                $repeatCustomersQuery = "
                    SELECT COUNT(DISTINCT customer_id) as repeat_customers
                    FROM services
                    WHERE service_date BETWEEN :from_date AND :to_date
                    AND customer_id IN (
                        SELECT customer_id
                        FROM services
                        GROUP BY customer_id
                        HAVING COUNT(*) > 1
                    )
                ";
                $repeatCustomersStmt = $db->prepare($repeatCustomersQuery);
                $repeatCustomersStmt->bindParam(':from_date', $from);
                $repeatCustomersStmt->bindParam(':to_date', $to);
                $repeatCustomersStmt->execute();
                $repeatCustomers = $repeatCustomersStmt->fetch(PDO::FETCH_ASSOC);

                $report = [
                    'period' => ['from' => $from, 'to' => $to],
                    'summary' => [
                        'totalCustomers' => (int)$customerData['total_customers'],
                        'activeCustomers' => (int)$customerData['active_customers'],
                        'averageServiceValue' => (float)$customerData['average_service_value']
                    ],
                    'retention' => [
                        'repeatCustomers' => (int)$repeatCustomers['repeat_customers']
                    ],
                    'topCustomers' => $topCustomers
                ];
                break;

            case 'inventory':
                // Get inventory statistics
                $inventoryQuery = "
                    SELECT
                        COUNT(*) as total_items,
                        SUM(quantity) as total_quantity,
                        COALESCE(SUM(quantity * unit_price), 0) as total_value,
                        SUM(CASE WHEN quantity <= reorder_level THEN 1 ELSE 0 END) as low_stock_items
                    FROM inventory
                ";
                $inventoryStmt = $db->prepare($inventoryQuery);
                $inventoryStmt->execute();
                $inventoryData = $inventoryStmt->fetch(PDO::FETCH_ASSOC);

                // Get low stock items
                $lowStockQuery = "
                    SELECT
                        item_name as itemName,
                        category,
                        quantity,
                        unit_price as unitPrice,
                        (quantity * unit_price) as totalValue,
                        reorder_level as reorderLevel
                    FROM inventory
                    WHERE quantity <= reorder_level
                    ORDER BY quantity ASC
                ";
                $lowStockStmt = $db->prepare($lowStockQuery);
                $lowStockStmt->execute();
                $lowStock = $lowStockStmt->fetchAll(PDO::FETCH_ASSOC);

                $report = [
                    'period' => ['from' => $from, 'to' => $to],
                    'summary' => [
                        'totalItems' => (int)$inventoryData['total_items'],
                        'totalQuantity' => (int)$inventoryData['total_quantity'],
                        'totalValue' => (float)$inventoryData['total_value'],
                        'lowStockItems' => (int)$inventoryData['low_stock_items']
                    ],
                    'lowStock' => $lowStock
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

