<?php
/**
 * Debug Warranty API
 * Test the warranty API functionality
 */

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';

try {
    echo "Testing warranty API...\n";
    
    $database = new Database();
    $db = $database->getConnection();
    echo "Database connection successful\n";
    
    // Test individual warranty query
    $warrantyId = 27;
    echo "Testing warranty ID: $warrantyId\n";
    
    $stmt = $db->prepare("
        SELECT 
            w.*,
            c.name as customer_name,
            c.phone as customer_phone,
            c.email as customer_email,
            c.address as customer_address,
            v.plate_number as vehicle_plate,
            v.vin_number as vehicle_vin,
            v.year as vehicle_year,
            v.current_km,
            vm.name as vehicle_model,
            vm.category as vehicle_category
        FROM warranties w
        LEFT JOIN vehicles v ON w.vehicle_id = v.id
        LEFT JOIN customers c ON v.customer_id = c.id
        LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
        WHERE w.id = ?
    ");
    
    $stmt->execute([$warrantyId]);
    $warranty = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($warranty) {
        echo "Warranty found:\n";
        echo "ID: " . $warranty['id'] . "\n";
        echo "Vehicle ID: " . $warranty['vehicle_id'] . "\n";
        echo "Customer Name: " . ($warranty['customer_name'] ?: 'NULL') . "\n";
        echo "Vehicle Plate: " . ($warranty['vehicle_plate'] ?: 'NULL') . "\n";
        echo "Vehicle Model: " . ($warranty['vehicle_model'] ?: 'NULL') . "\n";
    } else {
        echo "No warranty found with ID: $warrantyId\n";
    }
    
    // Test warranty list query
    echo "\nTesting warranty list...\n";
    $stmt = $db->prepare("
        SELECT 
            w.*,
            c.name as customer_name,
            c.phone as customer_phone,
            c.email as customer_email,
            c.address as customer_address,
            v.plate_number as vehicle_plate,
            v.vin_number as vehicle_vin,
            v.year as vehicle_year,
            v.current_km,
            vm.name as vehicle_model,
            vm.category as vehicle_category
        FROM warranties w
        LEFT JOIN vehicles v ON w.vehicle_id = v.id
        LEFT JOIN customers c ON v.customer_id = c.id
        LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
        ORDER BY w.created_at DESC
        LIMIT 10
    ");
    
    $stmt->execute();
    $warranties = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($warranties) . " warranties\n";
    foreach ($warranties as $w) {
        echo "- ID: " . $w['id'] . ", Customer: " . ($w['customer_name'] ?: 'NULL') . ", Vehicle: " . ($w['vehicle_plate'] ?: 'NULL') . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>






