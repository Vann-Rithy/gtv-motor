<?php
/**
 * Debug script to test exchange rate API functionality
 * This script will help us understand what's happening with the exchange rate fields
 */

require_once 'config/config.php';
require_once 'config/database.php';

// Set up error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "=== EXCHANGE RATE API DEBUG ===\n";
    echo "Database connection successful!\n\n";
    
    // Check if columns exist
    $stmt = $db->query('DESCRIBE services');
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Services table columns:\n";
    $exchangeRateExists = false;
    $totalKhrExists = false;
    
    foreach ($columns as $column) {
        echo "- " . $column['Field'] . " (" . $column['Type'] . ") Default: " . $column['Default'] . "\n";
        if ($column['Field'] === 'exchange_rate') {
            $exchangeRateExists = true;
        }
        if ($column['Field'] === 'total_khr') {
            $totalKhrExists = true;
        }
    }
    
    if (!$exchangeRateExists) {
        echo "\n❌ ERROR: exchange_rate column does not exist!\n";
        echo "You need to run: ALTER TABLE services ADD COLUMN exchange_rate decimal(8,2) DEFAULT 0.00;\n";
    }
    
    if (!$totalKhrExists) {
        echo "\n❌ ERROR: total_khr column does not exist!\n";
        echo "You need to run: ALTER TABLE services ADD COLUMN total_khr decimal(12,2) DEFAULT 0.00;\n";
    }
    
    if ($exchangeRateExists && $totalKhrExists) {
        echo "\n✓ Both exchange_rate and total_khr columns exist!\n";
        
        // Test the exact INSERT statement from the API
        echo "\nTesting INSERT with exchange rate data...\n";
        
        $testData = [
            'invoice_number' => 'DEBUG-' . time(),
            'customer_id' => 1,
            'vehicle_id' => 1,
            'vehicle_model_id' => 1,
            'service_type_id' => 1,
            'service_date' => '2025-01-01',
            'current_km' => null,
            'volume_l' => null,
            'next_service_km' => null,
            'next_service_date' => null,
            'total_amount' => 100.00,
            'payment_method' => 'cash',
            'payment_status' => 'pending',
            'service_status' => 'pending',
            'notes' => 'Debug test',
            'service_detail' => 'Debug test service',
            'technician_id' => null,
            'sales_rep_id' => null,
            'customer_type' => 'walking',
            'booking_id' => null,
            'exchange_rate' => 4080.00,
            'total_khr' => 408000.00
        ];
        
        $stmt = $db->prepare("
            INSERT INTO services (
                invoice_number, customer_id, vehicle_id, vehicle_model_id, service_type_id, service_date,
                current_km, volume_l, next_service_km, next_service_date, total_amount, payment_method, 
                payment_status, service_status, notes, service_detail, technician_id, 
                sales_rep_id, customer_type, booking_id, exchange_rate, total_khr, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        echo "Executing INSERT with exchange_rate: 4080, total_khr: 408000\n";
        
        $result = $stmt->execute([
            $testData['invoice_number'], $testData['customer_id'], $testData['vehicle_id'], 
            $testData['vehicle_model_id'], $testData['service_type_id'], $testData['service_date'],
            $testData['current_km'], $testData['volume_l'], $testData['next_service_km'], 
            $testData['next_service_date'], $testData['total_amount'], $testData['payment_method'],
            $testData['payment_status'], $testData['service_status'], $testData['notes'], 
            $testData['service_detail'], $testData['technician_id'],
            $testData['sales_rep_id'], $testData['customer_type'], $testData['booking_id'], 
            $testData['exchange_rate'], $testData['total_khr']
        ]);
        
        if ($result) {
            $serviceId = $db->lastInsertId();
            echo "✓ INSERT successful! Service ID: " . $serviceId . "\n";
            
            // Verify the data was inserted correctly
            $stmt = $db->prepare("SELECT id, exchange_rate, total_khr FROM services WHERE id = ?");
            $stmt->execute([$serviceId]);
            $service = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo "Retrieved data:\n";
            echo "- ID: " . $service['id'] . "\n";
            echo "- Exchange Rate: " . $service['exchange_rate'] . "\n";
            echo "- Total KHR: " . $service['total_khr'] . "\n";
            
            if ($service['exchange_rate'] == 4080 && $service['total_khr'] == 408000) {
                echo "✓ Data verification successful!\n";
            } else {
                echo "❌ Data verification failed!\n";
                echo "Expected: exchange_rate=4080, total_khr=408000\n";
                echo "Actual: exchange_rate=" . $service['exchange_rate'] . ", total_khr=" . $service['total_khr'] . "\n";
            }
            
            // Clean up test data
            $stmt = $db->prepare("DELETE FROM services WHERE id = ?");
            $stmt->execute([$serviceId]);
            echo "✓ Test data cleaned up.\n";
            
        } else {
            echo "❌ INSERT failed!\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>






