<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Database connection successful!\n";
    
    // Test inserting a service with exchange rate
    $testData = [
        'exchange_rate' => 4080,
        'total_khr' => 40800,
        'total_amount' => 10
    ];
    
    echo "Test data: " . json_encode($testData) . "\n";
    
    $exchangeRate = isset($testData['exchange_rate']) ? (float)$testData['exchange_rate'] : 0.00;
    $totalKhr = isset($testData['total_khr']) ? (float)$testData['total_khr'] : ($testData['total_amount'] * $exchangeRate);
    
    echo "Processed exchange rate: " . $exchangeRate . "\n";
    echo "Processed total KHR: " . $totalKhr . "\n";
    
    // Check if columns exist
    $stmt = $db->query('DESCRIBE services');
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $exchangeRateExists = false;
    $totalKhrExists = false;
    
    foreach ($columns as $column) {
        if ($column['Field'] === 'exchange_rate') {
            $exchangeRateExists = true;
            echo "Exchange Rate Column: " . $column['Type'] . " Default: " . $column['Default'] . "\n";
        }
        if ($column['Field'] === 'total_khr') {
            $totalKhrExists = true;
            echo "Total KHR Column: " . $column['Type'] . " Default: " . $column['Default'] . "\n";
        }
    }
    
    if (!$exchangeRateExists) {
        echo "ERROR: exchange_rate column does not exist!\n";
    }
    if (!$totalKhrExists) {
        echo "ERROR: total_khr column does not exist!\n";
    }
    
    if ($exchangeRateExists && $totalKhrExists) {
        echo "Both columns exist. Testing INSERT...\n";
        
        // Test INSERT with exchange rate
        $stmt = $db->prepare("
            INSERT INTO services (
                invoice_number, customer_id, vehicle_id, vehicle_model_id, service_type_id, service_date,
                total_amount, payment_method, payment_status, service_status, 
                exchange_rate, total_khr, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $result = $stmt->execute([
            'TEST-001', 1, 1, 1, 1, '2025-01-01',
            10.00, 'cash', 'pending', 'pending',
            $exchangeRate, $totalKhr
        ]);
        
        if ($result) {
            $serviceId = $db->lastInsertId();
            echo "Test INSERT successful! Service ID: " . $serviceId . "\n";
            
            // Verify the data was inserted correctly
            $stmt = $db->prepare("SELECT id, exchange_rate, total_khr FROM services WHERE id = ?");
            $stmt->execute([$serviceId]);
            $service = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo "Retrieved data: " . json_encode($service) . "\n";
            
            // Clean up test data
            $stmt = $db->prepare("DELETE FROM services WHERE id = ?");
            $stmt->execute([$serviceId]);
            echo "Test data cleaned up.\n";
        } else {
            echo "Test INSERT failed!\n";
        }
    }
    
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . "\n";
}
?>
