<?php
/**
 * Exchange Rate Update API
 * Dedicated endpoint for updating exchange rates
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
        
        // Validate required fields
        if (!isset($data['service_id']) || !isset($data['exchange_rate'])) {
            Response::error('Missing required fields: service_id and exchange_rate', 400);
        }
        
        $serviceId = (int)$data['service_id'];
        $exchangeRate = (float)$data['exchange_rate'];
        $totalKhr = isset($data['total_khr']) ? (float)$data['total_khr'] : 0;
        
        // Validate service exists
        $stmt = $db->prepare("SELECT id, total_amount FROM services WHERE id = ?");
        $stmt->execute([$serviceId]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$service) {
            Response::error('Service not found', 404);
        }
        
        // Calculate total_khr if not provided
        if ($totalKhr === 0) {
            $totalKhr = $service['total_amount'] * $exchangeRate;
        }
        
        // Update exchange rate and total KHR
        $stmt = $db->prepare("UPDATE services SET exchange_rate = ?, total_khr = ?, updated_at = NOW() WHERE id = ?");
        $result = $stmt->execute([$exchangeRate, $totalKhr, $serviceId]);
        
        if ($result) {
            // Get updated service
            $stmt = $db->prepare("SELECT * FROM services WHERE id = ?");
            $stmt->execute([$serviceId]);
            $updatedService = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::success($updatedService, 'Exchange rate updated successfully');
        } else {
            Response::error('Failed to update exchange rate', 500);
        }
        
    } else {
        Response::error('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log("Exchange Rate API Error: " . $e->getMessage());
    Response::error('Internal server error', 500);
}
?>
