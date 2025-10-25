<?php
/**
 * Simple Exchange Rate Update Endpoint
 * This works with the existing server infrastructure
 */

// Set headers for CORS and JSON
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Also check form data as fallback
if (!$input) {
    $input = [
        'serviceId' => $_POST['serviceId'] ?? null,
        'exchangeRate' => $_POST['exchangeRate'] ?? null
    ];
}

if (!$input || !isset($input['serviceId']) || !isset($input['exchangeRate'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields: serviceId and exchangeRate']);
    exit;
}

$serviceId = (int)$input['serviceId'];
$exchangeRate = (float)$input['exchangeRate'];

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
    
    // Calculate total_khr
    $totalKhr = $service['total_amount'] * $exchangeRate;
    
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
