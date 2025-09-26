<?php
/**
 * Debug Customers API
 * Test the exact query that's failing
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Request.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    // Get token from URL parameter first, then Authorization header
    $token = $_GET['token'] ?? Request::authorization();

    if (!$token) {
        Response::unauthorized('No authorization token provided');
    }

    // Remove 'Bearer ' prefix if present
    $token = str_replace('Bearer ', '', $token);

    // Simple token validation (base64 encoded JSON)
    try {
        $payload = json_decode(base64_decode($token), true);

        if (!$payload || !isset($payload['user_id']) || !isset($payload['exp'])) {
            Response::unauthorized('Invalid token format');
        }

        // Check if token is expired
        if ($payload['exp'] < time()) {
            Response::unauthorized('Token expired');
        }

        // Get user from database
        require_once __DIR__ . '/../config/database.php';
        $database = new Database();
        $conn = $database->getConnection();

        $stmt = $conn->prepare("
            SELECT u.*, s.name as staff_name, s.role as staff_role
            FROM users u
            LEFT JOIN staff s ON u.staff_id = s.id
            WHERE u.id = ? AND u.is_active = 1
        ");
        $stmt->execute([$payload['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            Response::unauthorized('User not found or inactive');
        }

    } catch (Exception $e) {
        Response::unauthorized('Invalid token');
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Test 1: Simple customers query
    echo "Testing simple customers query...\n";
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM customers");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Customers count: " . $result['count'] . "\n";
    
    // Test 2: Check if vehicles table exists
    echo "Testing vehicles table...\n";
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM vehicles");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Vehicles count: " . $result['count'] . "\n";
    
    // Test 3: Check if services table exists
    echo "Testing services table...\n";
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM services");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Services count: " . $result['count'] . "\n";
    
    // Test 4: Check if service_alerts table exists
    echo "Testing service_alerts table...\n";
    try {
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM service_alerts");
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Service alerts count: " . $result['count'] . "\n";
    } catch (Exception $e) {
        echo "Service alerts table error: " . $e->getMessage() . "\n";
    }
    
    // Test 5: Check if bookings table exists and has JSON data
    echo "Testing bookings table...\n";
    try {
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM bookings");
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Bookings count: " . $result['count'] . "\n";
        
        // Test JSON function
        $stmt = $db->prepare("SELECT JSON_UNQUOTE(JSON_EXTRACT(customer_data, '$.phone')) as phone FROM bookings LIMIT 1");
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Sample booking phone: " . ($result['phone'] ?? 'NULL') . "\n";
    } catch (Exception $e) {
        echo "Bookings table error: " . $e->getMessage() . "\n";
    }
    
    // Test 6: Try the problematic query step by step
    echo "Testing complex query components...\n";
    
    // Test the ROW_NUMBER window function
    try {
        $stmt = $db->prepare("
            SELECT DISTINCT customer_id, plate_number, model, warranty_end_date,
                   ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) as rn
            FROM vehicles
            LIMIT 5
        ");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "ROW_NUMBER test successful: " . count($results) . " rows\n";
    } catch (Exception $e) {
        echo "ROW_NUMBER test failed: " . $e->getMessage() . "\n";
    }
    
    Response::success([
        'debug' => 'Database connectivity and table checks completed',
        'timestamp' => date('Y-m-d H:i:s')
    ], 'Debug test completed');
    
} catch (Exception $e) {
    error_log("Debug API error: " . $e->getMessage());
    Response::error('Debug test failed: ' . $e->getMessage(), 500);
}
?>
