<?php
/**
 * Dashboard Recent Services API
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
        // Get recent services (last 10)
        $stmt = $db->prepare("
            SELECT
                s.*,
                c.name as customer_name,
                c.phone as customer_phone,
                v.plate_number as vehicle_plate,
                v.model as vehicle_model,
                st.service_type_name
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN service_types st ON s.service_type_id = st.id
            ORDER BY s.service_date DESC
            LIMIT 10
        ");
        $stmt->execute();
        $recentServices = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success($recentServices, 'Recent services retrieved successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Recent Services API error: " . $e->getMessage());
    Response::error('Failed to get recent services', 500);
}
?>
