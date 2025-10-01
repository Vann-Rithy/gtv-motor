<?php
/**
 * GTV Motor - Database Connection Test
 * Direct test of database connectivity and queries
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include configuration
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/Response.php';

header('Content-Type: text/plain');

try {
    echo "Testing database connection...\n";
    
    // Test database connection
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Database connection failed");
    }
    
    echo "✅ Database connection successful\n";
    
    // Test customers table
    echo "\nTesting customers table...\n";
    try {
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM customers");
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "✅ Customers table: {$result['count']} records\n";
    } catch (Exception $e) {
        echo "❌ Customers table error: " . $e->getMessage() . "\n";
    }
    
    // Test services table
    echo "\nTesting services table...\n";
    try {
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM services");
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "✅ Services table: {$result['count']} records\n";
    } catch (Exception $e) {
        echo "❌ Services table error: " . $e->getMessage() . "\n";
    }
    
    // Test vehicles table
    echo "\nTesting vehicles table...\n";
    try {
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM vehicles");
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "✅ Vehicles table: {$result['count']} records\n";
    } catch (Exception $e) {
        echo "❌ Vehicles table error: " . $e->getMessage() . "\n";
    }
    
    // Test the actual customers query from the API
    echo "\nTesting customers API query...\n";
    try {
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
        
        echo "✅ Customers query successful: " . count($customers) . " records\n";
    } catch (Exception $e) {
        echo "❌ Customers query error: " . $e->getMessage() . "\n";
        $customers = [];
    }
    
    // Test the actual services query from the API
    echo "\nTesting services API query...\n";
    try {
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
        
        echo "✅ Services query successful: " . count($services) . " records\n";
    } catch (Exception $e) {
        echo "❌ Services query error: " . $e->getMessage() . "\n";
        $services = [];
    }
    
    // Test JSON encoding
    echo "\nTesting JSON encoding...\n";
    $testData = [
        'success' => true,
        'data' => $customers,
        'message' => 'Test successful'
    ];
    
    $json = json_encode($testData, JSON_PRETTY_PRINT);
    if ($json === false) {
        throw new Exception("JSON encoding failed: " . json_last_error_msg());
    }
    
    echo "✅ JSON encoding successful: " . strlen($json) . " characters\n";
    
    // Return success response
    echo "\n🎉 Database test completed successfully!\n";
    echo "Database connection: OK\n";
    echo "Customers count: " . count($customers) . "\n";
    echo "Services count: " . count($services) . "\n";
    echo "JSON encoding: OK\n";
    
    if (!empty($customers)) {
        echo "Sample customer: " . ($customers[0]['name'] ?? 'N/A') . "\n";
    }
    if (!empty($services)) {
        echo "Sample service: " . ($services[0]['service_type_name'] ?? 'N/A') . "\n";
    }
    
} catch (Exception $e) {
    error_log("Database test error: " . $e->getMessage());
    echo "\n❌ Database test failed: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>
