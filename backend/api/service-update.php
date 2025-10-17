<?php
/**
 * Service Update API - Simple Update Endpoint
 * GTV Motor PHP Backend
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Request.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    require_once __DIR__ . '/../config/database.php';
    $database = new Database();
    $db = $database->getConnection();

    $method = Request::method();

    if ($method === 'POST') {
        $data = Request::body();
        
        // Get service ID from URL path
        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        $segments = array_filter($segments);
        $segments = array_values($segments);
        
        $serviceId = null;
        if (isset($segments[2]) && is_numeric($segments[2])) {
            $serviceId = (int)$segments[2];
        }
        
        if (!$serviceId) {
            Response::error('Service ID is required', 400);
        }
        
        // Validate service exists
        $stmt = $db->prepare("SELECT id FROM services WHERE id = ?");
        $stmt->execute([$serviceId]);
        if (!$stmt->fetch()) {
            Response::error('Service not found', 404);
        }
        
        // Build dynamic UPDATE query based on provided fields
        $updateFields = [];
        $updateValues = [];
        
        if (isset($data['payment_status'])) {
            $updateFields[] = "payment_status = ?";
            $updateValues[] = Request::sanitize($data['payment_status']);
            
            // Auto-update service status based on payment status
            if ($data['payment_status'] === 'paid') {
                $updateFields[] = "service_status = ?";
                $updateValues[] = 'completed';
            } elseif ($data['payment_status'] === 'cancelled') {
                $updateFields[] = "service_status = ?";
                $updateValues[] = 'cancelled';
            }
        }
        
        if (isset($data['service_status'])) {
            $updateFields[] = "service_status = ?";
            $updateValues[] = Request::sanitize($data['service_status']);
        }
        
        if (isset($data['payment_method'])) {
            $updateFields[] = "payment_method = ?";
            $updateValues[] = Request::sanitize($data['payment_method']);
        }
        
        if (isset($data['total_amount'])) {
            $updateFields[] = "total_amount = ?";
            $updateValues[] = (float)$data['total_amount'];
        }
        
        if (isset($data['notes'])) {
            $updateFields[] = "notes = ?";
            $updateValues[] = Request::sanitize($data['notes']);
        }
        
        if (isset($data['service_detail'])) {
            $updateFields[] = "service_detail = ?";
            $updateValues[] = Request::sanitize($data['service_detail']);
        }
        
        if (isset($data['current_km'])) {
            $updateFields[] = "current_km = ?";
            $updateValues[] = isset($data['current_km']) ? (int)$data['current_km'] : null;
        }
        
        if (isset($data['next_service_km'])) {
            $updateFields[] = "next_service_km = ?";
            $updateValues[] = isset($data['next_service_km']) ? (int)$data['next_service_km'] : null;
        }
        
        if (isset($data['next_service_date'])) {
            $updateFields[] = "next_service_date = ?";
            $updateValues[] = $data['next_service_date'] ?? null;
        }
        
        if (isset($data['technician_id'])) {
            $updateFields[] = "technician_id = ?";
            $updateValues[] = isset($data['technician_id']) ? (int)$data['technician_id'] : null;
        }
        
        if (isset($data['sales_rep_id'])) {
            $updateFields[] = "sales_rep_id = ?";
            $updateValues[] = isset($data['sales_rep_id']) ? (int)$data['sales_rep_id'] : null;
        }
        
        // Always update the updated_at timestamp
        $updateFields[] = "updated_at = NOW()";
        
        if (empty($updateFields)) {
            Response::error('No fields to update', 400);
        }
        
        $updateValues[] = $serviceId; // Add service ID for WHERE clause
        
        $updateQuery = "UPDATE services SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $db->prepare($updateQuery);
        $stmt->execute($updateValues);
        
        // Get the updated service with complete information
        $stmt = $db->prepare("
            SELECT s.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
                   v.plate_number as vehicle_plate, v.year as vehicle_year, v.vin_number as vehicle_vin_number,
                   vm.name as vehicle_model_name, vm.category as vehicle_model_category,
                   st.service_type_name, st.category as service_category,
                   tech.name as technician_name, sales.name as sales_rep_name
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            LEFT JOIN service_types st ON s.service_type_id = st.id
            LEFT JOIN staff tech ON s.technician_id = tech.id
            LEFT JOIN staff sales ON s.sales_rep_id = sales.id
            WHERE s.id = ?
        ");
        $stmt->execute([$serviceId]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::success($service, 'Service updated successfully');
        
    } else {
        Response::error('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log("Service Update API error: " . $e->getMessage());
    Response::error('Failed to process service update request', 500);
}
?>
