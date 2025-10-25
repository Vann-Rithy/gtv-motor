<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Testing exchange rate database operations...\n";
    
    // Test 1: Check if columns exist
    $stmt = $db->query('DESCRIBE services');
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $exchangeRateExists = false;
    $totalKhrExists = false;
    
    foreach ($columns as $column) {
        if ($column['Field'] === 'exchange_rate') {
            $exchangeRateExists = true;
            echo "✓ exchange_rate column exists: " . $column['Type'] . " Default: " . $column['Default'] . "\n";
        }
        if ($column['Field'] === 'total_khr') {
            $totalKhrExists = true;
            echo "✓ total_khr column exists: " . $column['Type'] . " Default: " . $column['Default'] . "\n";
        }
    }
    
    if (!$exchangeRateExists || !$totalKhrExists) {
        echo "❌ Missing columns!\n";
        exit(1);
    }
    
    // Test 2: Insert test data
    echo "\nTesting INSERT with exchange rate 4080...\n";
    
    $stmt = $db->prepare("
        INSERT INTO services (
            invoice_number, customer_id, vehicle_id, vehicle_model_id, service_type_id, service_date,
            total_amount, payment_method, payment_status, service_status, 
            exchange_rate, total_khr, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    
    $exchangeRate = 4080.00;
    $totalKhr = 40800.00;
    
    $result = $stmt->execute([
        'TEST-' . time(), 1, 1, 1, 1, '2025-01-01',
        10.00, 'cash', 'pending', 'pending',
        $exchangeRate, $totalKhr
    ]);
    
    if ($result) {
        $serviceId = $db->lastInsertId();
        echo "✓ Test INSERT successful! Service ID: " . $serviceId . "\n";
        
        // Test 3: Verify the data was inserted correctly
        $stmt = $db->prepare("SELECT id, exchange_rate, total_khr FROM services WHERE id = ?");
        $stmt->execute([$serviceId]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "Retrieved data:\n";
        echo "  ID: " . $service['id'] . "\n";
        echo "  Exchange Rate: " . $service['exchange_rate'] . "\n";
        echo "  Total KHR: " . $service['total_khr'] . "\n";
        
        if ($service['exchange_rate'] == 4080 && $service['total_khr'] == 40800) {
            echo "✓ Data verification successful!\n";
        } else {
            echo "❌ Data verification failed!\n";
            echo "Expected: exchange_rate=4080, total_khr=40800\n";
            echo "Actual: exchange_rate=" . $service['exchange_rate'] . ", total_khr=" . $service['total_khr'] . "\n";
        }
        
        // Clean up test data
        $stmt = $db->prepare("DELETE FROM services WHERE id = ?");
        $stmt->execute([$serviceId]);
        echo "✓ Test data cleaned up.\n";
        
    } else {
        echo "❌ Test INSERT failed!\n";
    }
    
} catch (Exception $e) {
    echo '❌ Error: ' . $e->getMessage() . "\n";
}
?>
