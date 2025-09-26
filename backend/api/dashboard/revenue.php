<?php
/**
 * Dashboard Revenue API
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
        $range = Request::query('range') ?? 'monthly'; // daily, weekly, monthly, yearly

        $revenueData = [];
        $message = "Revenue data for range: {$range}";

        switch ($range) {
            case 'daily':
                // Last 7 days
                $stmt = $db->prepare("
                    SELECT
                        DATE(service_date) as date,
                        SUM(total_amount) as revenue,
                        COUNT(*) as service_count
                    FROM services
                    WHERE service_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                    AND payment_status = 'paid'
                    GROUP BY DATE(service_date)
                    ORDER BY date ASC
                ");
                $stmt->execute();
                $revenueData = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;

            case 'weekly':
                // Last 12 weeks
                $stmt = $db->prepare("
                    SELECT
                        YEARWEEK(service_date) as week,
                        SUM(total_amount) as revenue,
                        COUNT(*) as service_count
                    FROM services
                    WHERE service_date >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
                    AND payment_status = 'paid'
                    GROUP BY YEARWEEK(service_date)
                    ORDER BY week ASC
                ");
                $stmt->execute();
                $revenueData = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;

            case 'monthly':
                // Last 12 months
                $stmt = $db->prepare("
                    SELECT
                        DATE_FORMAT(service_date, '%Y-%m') as month,
                        SUM(total_amount) as revenue,
                        COUNT(*) as service_count
                    FROM services
                    WHERE service_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                    AND payment_status = 'paid'
                    GROUP BY DATE_FORMAT(service_date, '%Y-%m')
                    ORDER BY month ASC
                ");
                $stmt->execute();
                $revenueData = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;

            case 'yearly':
                // Last 5 years
                $stmt = $db->prepare("
                    SELECT
                        YEAR(service_date) as year,
                        SUM(total_amount) as revenue,
                        COUNT(*) as service_count
                    FROM services
                    WHERE service_date >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
                    AND payment_status = 'paid'
                    GROUP BY YEAR(service_date)
                    ORDER BY year ASC
                ");
                $stmt->execute();
                $revenueData = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;

            default:
                Response::error('Invalid range parameter', 400);
        }

        Response::success($revenueData, $message);

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Revenue API error: " . $e->getMessage());
    Response::error('Failed to get revenue data', 500);
}
?>
