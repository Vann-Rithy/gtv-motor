<?php
/**
 * Warranty Reports API
 * GTV Motor PHP Backend
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/Auth.php';

try {
    $auth = new Auth();
    $user = $auth->requireAuth();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $fromDate = Request::query('from') ?? '2024-01-01';
    $toDate = Request::query('to') ?? date('Y-m-d');
    $status = Request::query('status');
    $expiringSoon = Request::query('expiring_soon') === 'true';
    
    $where = [];
    $params = [];
    
    if ($status) {
        $where[] = "w.status = ?";
        $params[] = $status;
    }
    
    if ($expiringSoon) {
        $where[] = "w.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)";
    }
    
    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
    
    // Get warranties with details
    $query = "
        SELECT 
            w.*,
            c.name as customer_name,
            c.phone as customer_phone,
            c.email as customer_email,
            c.address as customer_address,
            v.plate_number as vehicle_plate,
            v.model as vehicle_model,
            v.vin_number as vehicle_vin,
            v.year as vehicle_year,
            v.current_km,
            COUNT(DISTINCT ws.id) as services_used,
            MAX(ws.service_date) as last_service_date,
            COALESCE(SUM(ws.cost_covered), 0) as total_cost_covered,
            DATEDIFF(w.end_date, CURDATE()) as days_until_expiry,
            CASE 
                WHEN w.end_date < CURDATE() THEN 'expired'
                WHEN w.end_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'expiring_soon'
                WHEN w.end_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_month'
                ELSE 'active'
            END as expiry_status
        FROM warranties w
        LEFT JOIN vehicles v ON w.vehicle_id = v.id
        LEFT JOIN customers c ON v.customer_id = c.id
        LEFT JOIN warranty_services ws ON w.id = ws.warranty_id
        {$whereClause}
        GROUP BY w.id
        ORDER BY w.end_date ASC
    ";
    
    $warranties = $db->query($query)->fetchAll(PDO::FETCH_ASSOC);
    
    // Get warranty statistics
    $stmt = $db->prepare("
        SELECT 
            COUNT(*) as total_warranties,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_warranties,
            SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_warranties,
            SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_warranties,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_warranties,
            SUM(CASE WHEN end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring_soon,
            COALESCE(SUM(total_cost_covered), 0) as total_cost_covered
        FROM warranties w
        LEFT JOIN warranty_services ws ON w.id = ws.warranty_id
        {$whereClause}
    ");
    $stmt->execute($params);
    $statistics = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get warranties by type
    $stmt = $db->prepare("
        SELECT 
            warranty_type,
            COUNT(*) as count,
            COALESCE(SUM(total_cost_covered), 0) as total_cost_covered
        FROM warranties w
        LEFT JOIN warranty_services ws ON w.id = ws.warranty_id
        {$whereClause}
        GROUP BY warranty_type
        ORDER BY count DESC
    ");
    $stmt->execute($params);
    $warrantiesByType = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get monthly warranty trends
    $stmt = $db->prepare("
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as month,
            COUNT(*) as new_warranties,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_warranties
        FROM warranties
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month
    ");
    $stmt->execute([$fromDate, $toDate]);
    $monthlyTrends = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $warrantyReport = [
        'warranties' => $warranties,
        'statistics' => $statistics,
        'warranties_by_type' => $warrantiesByType,
        'monthly_trends' => $monthlyTrends,
        'period' => [
            'from' => $fromDate,
            'to' => $toDate
        ]
    ];
    
    Response::success($warrantyReport, 'Warranty report generated successfully');
    
} catch (Exception $e) {
    error_log("Warranty reports API error: " . $e->getMessage());
    Response::error('Failed to generate warranty report', 500);
}
?>
