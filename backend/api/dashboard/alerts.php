<?php
/**
 * Dashboard Alerts API
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

    // Get recent alerts for dashboard
    $limit = Request::query('limit') ?? 10;
    $limit = min((int)$limit, 50); // Max 50 alerts

    $query = "
        SELECT
            sa.*,
            c.name as customer_name,
            c.phone as customer_phone,
            v.plate_number as vehicle_plate,
            v.model as vehicle_model,
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
        WHERE sa.status = 'pending'
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

    $stmt = $db->prepare($query);
    $stmt->execute([$limit]);
    $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get alert counts by urgency
    $countQuery = "
        SELECT
            COUNT(CASE WHEN alert_date < CURDATE() THEN 1 END) as overdue,
            COUNT(CASE WHEN alert_date = CURDATE() THEN 1 END) as due_today,
            COUNT(CASE WHEN alert_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as due_soon,
            COUNT(*) as total
        FROM service_alerts
        WHERE status = 'pending'
    ";

    $stmt = $db->prepare($countQuery);
    $stmt->execute();
    $counts = $stmt->fetch(PDO::FETCH_ASSOC);

    $data = [
        'alerts' => $alerts,
        'counts' => $counts
    ];

    Response::success($data, 'Dashboard alerts retrieved successfully');

} catch (Exception $e) {
    error_log("Dashboard alerts API error: " . $e->getMessage());
    Response::error('Failed to retrieve dashboard alerts', 500);
}
?>
