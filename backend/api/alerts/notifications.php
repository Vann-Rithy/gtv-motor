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
            $totalStmt = $db->query("SELECT COUNT(*) FROM service_alerts");
            $notifications['counts']['total_alerts'] = (int)$totalStmt->fetchColumn();

            $pendingStmt = $db->query("SELECT COUNT(*) FROM service_alerts WHERE status = 'pending'");
            $notifications['counts']['pending_alerts'] = (int)$pendingStmt->fetchColumn();

            $overdueStmt = $db->query("SELECT COUNT(*) FROM service_alerts WHERE alert_date < CURDATE() AND status != 'completed'");
            $notifications['counts']['overdue_alerts'] = (int)$overdueStmt->fetchColumn();

            $dueTodayStmt = $db->query("SELECT COUNT(*) FROM service_alerts WHERE DATE(alert_date) = CURDATE() AND status != 'completed'");
            $notifications['counts']['due_today_alerts'] = (int)$dueTodayStmt->fetchColumn();

            $dueSoonStmt = $db->query("SELECT COUNT(*) FROM service_alerts WHERE alert_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND status != 'completed'");
            $notifications['counts']['due_soon_alerts'] = (int)$dueSoonStmt->fetchColumn();

            $serviceDueStmt = $db->query("SELECT COUNT(*) FROM service_alerts WHERE alert_type = 'service_due'");
            $notifications['counts']['service_due_alerts'] = (int)$serviceDueStmt->fetchColumn();

            $warrantyStmt = $db->query("SELECT COUNT(*) FROM service_alerts WHERE alert_type = 'warranty_expiring'");
            $notifications['counts']['warranty_alerts'] = (int)$warrantyStmt->fetchColumn();

            $followUpStmt = $db->query("SELECT COUNT(*) FROM service_alerts WHERE alert_type = 'follow_up'");
            $notifications['counts']['follow_up_alerts'] = (int)$followUpStmt->fetchColumn();

            // Get recent alerts for the frontend
            $limit = Request::query('limit') ?? 50;
            $limit = min((int)$limit, 100); // Max 100 alerts

            $status = Request::query('status');
            $type = Request::query('type');
            $search = Request::query('search');

            $where = [];
            $params = [];

            if ($status && $status !== 'all') {
                $where[] = "sa.status = ?";
                $params[] = $status;
            }

            if ($type && $type !== 'all') {
                $where[] = "sa.alert_type = ?";
                $params[] = $type;
            }

            if ($search) {
                $where[] = "(c.name LIKE ? OR v.plate_number LIKE ? OR v.model LIKE ?)";
                $searchTerm = '%' . $search . '%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }

            $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

            $alertsQuery = "
                SELECT
                    sa.*,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    c.email as customer_email,
                    c.address as customer_address,
                    v.plate_number as vehicle_plate,
                    v.model as vehicle_model,
                    v.vin_number as vehicle_vin,
                    v.year as vehicle_year,
                    DATEDIFF(sa.alert_date, CURDATE()) as days_until_due,
                    CASE
                        WHEN sa.alert_date < CURDATE() THEN 'overdue'
                        WHEN sa.alert_date = CURDATE() THEN 'due_today'
                        WHEN sa.alert_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'due_soon'
                        ELSE 'upcoming'
                    END as urgency_level
                FROM service_alerts sa
                LEFT JOIN customers c ON sa.customer_id = c.id
                LEFT JOIN vehicles v ON sa.vehicle_id = v.id
                {$whereClause}
                ORDER BY
                    CASE
                        WHEN sa.alert_date < CURDATE() THEN 1
                        WHEN sa.alert_date = CURDATE() THEN 2
                        WHEN sa.alert_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 3
                        ELSE 4
                    END,
                    sa.alert_date ASC
                LIMIT ?
            ";

            $params[] = $limit;
            $stmt = $db->prepare($alertsQuery);
            $stmt->execute($params);
            $notifications['recent_alerts'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
