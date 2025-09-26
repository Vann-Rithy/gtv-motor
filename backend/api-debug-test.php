<?php
/**
 * GTV Motor - API Debug Test
 * Comprehensive test of API endpoints to identify JSON parsing issues
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start output buffering to catch any unexpected output
ob_start();

try {
    // Include required files
    require_once __DIR__ . '/config/config.php';
    require_once __DIR__ . '/config/database.php';
    require_once __DIR__ . '/includes/Request.php';
    require_once __DIR__ . '/includes/Response.php';
    
    // Set JSON header
    header('Content-Type: application/json');
    
    // Get any unexpected output
    $unexpectedOutput = ob_get_clean();
    
    if (!empty($unexpectedOutput)) {
        throw new Exception("Unexpected output detected: " . $unexpectedOutput);
    }
    
    // Test database connection
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Database connection failed");
    }
    
    // Test customers query
    $query = "
        SELECT
            c.id, c.name, c.phone, c.address, c.email, c.created_at, c.updated_at,
            COUNT(DISTINCT v.id) as vehicle_count,
            COUNT(DISTINCT s.id) as service_count,
            COUNT(DISTINCT sa.id) as alert_count,
            COUNT(DISTINCT b.id) as booking_count,
            MAX(s.service_date) as last_service_date,
            SUM(s.total_amount) as total_spent,
            v_latest.plate_number as latest_vehicle_plate,
            v_latest.model as latest_vehicle_model,
            v_latest.warranty_end_date as latest_warranty_end,
            SUM(CASE WHEN s.service_status = 'pending' THEN 1 ELSE 0 END) as pending_services,
            SUM(CASE WHEN s.service_status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_services,
            SUM(CASE WHEN s.service_status = 'completed' THEN 1 ELSE 0 END) as completed_services,
            SUM(CASE WHEN sa.status = 'pending' AND sa.alert_date <= CURDATE() THEN 1 ELSE 0 END) as pending_alerts
        FROM customers c
        LEFT JOIN vehicles v ON c.id = v.customer_id
        LEFT JOIN services s ON c.id = s.customer_id
        LEFT JOIN service_alerts sa ON c.id = sa.customer_id
        LEFT JOIN bookings b ON JSON_UNQUOTE(JSON_EXTRACT(b.customer_data, '$.phone')) = c.phone
        LEFT JOIN (
            SELECT DISTINCT customer_id, plate_number, model, warranty_end_date,
                   ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) as rn
            FROM vehicles
        ) v_latest ON c.id = v_latest.customer_id AND v_latest.rn = 1
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT 10 OFFSET 0
    ";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Test services query
    $query = "
        SELECT
            s.*,
            c.name as customer_name,
            c.phone as customer_phone,
            c.email as customer_email,
            v.plate_number as vehicle_plate,
            v.model as vehicle_model,
            v.vin_number as vehicle_vin,
            v.year as vehicle_year,
            st.service_type_name,
            tech.name as technician_name,
            sales.name as sales_rep_name
        FROM services s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN vehicles v ON s.vehicle_id = v.id
        LEFT JOIN service_types st ON s.service_type_id = st.id
        LEFT JOIN staff tech ON s.technician_id = tech.id
        LEFT JOIN staff sales ON s.sales_rep_id = sales.id
        ORDER BY s.service_date DESC
        LIMIT 10 OFFSET 0
    ";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Test JSON encoding
    $testData = [
        'success' => true,
        'data' => $customers,
        'message' => 'Debug test successful'
    ];
    
    $json = json_encode($testData);
    if ($json === false) {
        throw new Exception("JSON encoding failed: " . json_last_error_msg());
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'API debug test completed successfully',
        'data' => [
            'database_connection' => 'OK',
            'customers_count' => count($customers),
            'services_count' => count($services),
            'json_encoding' => 'OK',
            'json_length' => strlen($json),
            'sample_customer' => $customers[0] ?? null,
            'sample_service' => $services[0] ?? null,
            'unexpected_output' => $unexpectedOutput
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    // Clean any output buffer
    ob_clean();
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
?>
