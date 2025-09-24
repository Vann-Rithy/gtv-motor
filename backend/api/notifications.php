<?php
/**
 * Notifications API
 * GTV Motor PHP Backend
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/Auth.php';

try {
    $auth = new Auth();
    $user = $auth->requireAuth();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $method = Request::method();
    
    if ($method === 'GET') {
        // Get notification counts
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total_alerts,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_alerts,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_alerts,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_alerts,
                SUM(CASE WHEN alert_date < CURDATE() THEN 1 ELSE 0 END) as overdue_alerts,
                SUM(CASE WHEN alert_date = CURDATE() THEN 1 ELSE 0 END) as due_today_alerts,
                SUM(CASE WHEN alert_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as due_soon_alerts,
                SUM(CASE WHEN alert_type = 'service_due' THEN 1 ELSE 0 END) as service_due_alerts,
                SUM(CASE WHEN alert_type = 'warranty_expiring' THEN 1 ELSE 0 END) as warranty_alerts,
                SUM(CASE WHEN alert_type = 'follow_up' THEN 1 ELSE 0 END) as follow_up_alerts
            FROM service_alerts
        ");
        $stmt->execute();
        $counts = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get recent alerts
        $stmt = $db->prepare("
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
            ORDER BY sa.alert_date ASC, sa.created_at DESC
            LIMIT 10
        ");
        $stmt->execute();
        $recentAlerts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $notifications = [
            'counts' => $counts,
            'recent_alerts' => $recentAlerts
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
