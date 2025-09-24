<?php
/**
 * Dashboard Stats API
 * GTV Motor PHP Backend
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/Auth.php';

try {
    $auth = new Auth();
    $user = $auth->requireAuth();
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Today's Services
    $stmt = $db->prepare("SELECT COUNT(*) AS count FROM services WHERE DATE(service_date) = CURDATE()");
    $stmt->execute();
    $todayServices = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Pending Bookings
    $stmt = $db->prepare("SELECT COUNT(*) AS count FROM bookings WHERE status = 'confirmed'");
    $stmt->execute();
    $pendingBookings = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Low Stock Items
    $stmt = $db->prepare("SELECT COUNT(*) AS count FROM inventory_items WHERE current_stock <= min_stock");
    $stmt->execute();
    $lowStock = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Upcoming Alerts
    $stmt = $db->prepare("
        SELECT COUNT(*) AS count FROM service_alerts 
        WHERE alert_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        AND status = 'pending'
    ");
    $stmt->execute();
    $upcomingAlerts = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Monthly Revenue
    $stmt = $db->prepare("
        SELECT COALESCE(SUM(total_amount), 0) AS revenue
        FROM services 
        WHERE DATE_FORMAT(service_date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
        AND service_status = 'completed'
    ");
    $stmt->execute();
    $monthlyRevenue = $stmt->fetch(PDO::FETCH_ASSOC)['revenue'];
    
    // Active Customers
    $stmt = $db->prepare("
        SELECT COUNT(DISTINCT customer_id) AS count
        FROM services 
        WHERE service_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    ");
    $stmt->execute();
    $activeCustomers = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Total Services
    $stmt = $db->prepare("SELECT COUNT(*) AS count FROM services WHERE service_status = 'completed'");
    $stmt->execute();
    $totalServices = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Total Customers
    $stmt = $db->prepare("SELECT COUNT(*) AS count FROM customers");
    $stmt->execute();
    $totalCustomers = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Total Vehicles
    $stmt = $db->prepare("SELECT COUNT(*) AS count FROM vehicles");
    $stmt->execute();
    $totalVehicles = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Services by Status
    $stmt = $db->prepare("
        SELECT 
            service_status,
            COUNT(*) as count
        FROM services 
        GROUP BY service_status
    ");
    $stmt->execute();
    $servicesByStatus = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Recent Services
    $stmt = $db->prepare("
        SELECT 
            s.id,
            s.invoice_number,
            s.service_date,
            s.total_amount,
            s.service_status,
            c.name as customer_name,
            v.plate_number as vehicle_plate,
            st.service_type_name
        FROM services s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN vehicles v ON s.vehicle_id = v.id
        LEFT JOIN service_types st ON s.service_type_id = st.id
        ORDER BY s.created_at DESC
        LIMIT 5
    ");
    $stmt->execute();
    $recentServices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Upcoming Bookings
    $stmt = $db->prepare("
        SELECT 
            b.id,
            b.booking_date,
            b.booking_time,
            b.status,
            JSON_UNQUOTE(JSON_EXTRACT(b.customer_data, '$.name')) as customer_name,
            JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.plate_number')) as vehicle_plate,
            st.service_type_name
        FROM bookings b
        LEFT JOIN service_types st ON b.service_type_id = st.id
        WHERE b.booking_date >= CURDATE()
        ORDER BY b.booking_date, b.booking_time
        LIMIT 5
    ");
    $stmt->execute();
    $upcomingBookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stats = [
        'today_services' => (int)$todayServices,
        'pending_bookings' => (int)$pendingBookings,
        'low_stock_items' => (int)$lowStock,
        'upcoming_alerts' => (int)$upcomingAlerts,
        'monthly_revenue' => (float)$monthlyRevenue,
        'active_customers' => (int)$activeCustomers,
        'total_services' => (int)$totalServices,
        'total_customers' => (int)$totalCustomers,
        'total_vehicles' => (int)$totalVehicles,
        'services_by_status' => $servicesByStatus,
        'recent_services' => $recentServices,
        'upcoming_bookings' => $upcomingBookings
    ];
    
    Response::success($stats, 'Dashboard stats retrieved successfully');
    
} catch (Exception $e) {
    error_log("Dashboard stats API error: " . $e->getMessage());
    Response::error('Failed to retrieve dashboard stats', 500);
}
?>
