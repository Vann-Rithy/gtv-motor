<?php
/**
 * Simple Exchange Rate Update Endpoint
 * This works with the existing server infrastructure
 */

// Simple CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['service_id']) || !isset($input['exchange_rate'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields: service_id and exchange_rate']);
    exit;
}

$serviceId = (int)$input['service_id'];
$exchangeRate = (float)$input['exchange_rate'];
$totalKhr = isset($input['total_khr']) ? (float)$input['total_khr'] : 0;

try {
    // Database connection - adjust these settings for your server
    $host = 'localhost';
    $dbname = 'gtv_motor';
    $username = 'root';
    $password = '';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check if service exists
    $stmt = $pdo->prepare("SELECT id, total_amount FROM services WHERE id = ?");
    $stmt->execute([$serviceId]);
    $service = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$service) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Service not found']);
        exit;
    }
    
    // Calculate total_khr if not provided
    if ($totalKhr === 0) {
        $totalKhr = $service['total_amount'] * $exchangeRate;
    }
    
    // Update exchange rate and total KHR
    $stmt = $pdo->prepare("UPDATE services SET exchange_rate = ?, total_khr = ?, updated_at = NOW() WHERE id = ?");
    $result = $stmt->execute([$exchangeRate, $totalKhr, $serviceId]);
    
    if ($result) {
        // Get updated service
        $stmt = $pdo->prepare("SELECT * FROM services WHERE id = ?");
        $stmt->execute([$serviceId]);
        $updatedService = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Exchange rate updated successfully',
            'data' => $updatedService
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to update exchange rate']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>
