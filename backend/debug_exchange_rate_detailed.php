<?php
/**
 * Debug script to test the exact database schema and INSERT statement
 * This will help us identify the exact issue with exchange rate uploads
 */

require_once 'config/config.php';
require_once 'config/database.php';

// Set up error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "=== EXCHANGE RATE DATABASE DEBUG ===\n";
    echo "Database connection successful!\n\n";
    
    // 1. Check the exact column structure
    echo "1. Checking services table structure:\n";
    $stmt = $db->query('DESCRIBE services');
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $columnPositions = [];
    foreach ($columns as $index => $column) {
        $columnPositions[$column['Field']] = $index + 1;
        echo sprintf("%2d. %-20s %-20s %-5s %-10s %s\n", 
            $index + 1, 
            $column['Field'], 
            $column['Type'], 
            $column['Null'], 
            $column['Default'] ?? 'NULL', 
            $column['Comment'] ?? ''
        );
    }
    
    // 2. Check if exchange_rate and total_khr exist and their positions
    echo "\n2. Exchange rate columns check:\n";
    if (isset($columnPositions['exchange_rate'])) {
        echo "✓ exchange_rate found at position: " . $columnPositions['exchange_rate'] . "\n";
    } else {
        echo "❌ exchange_rate column NOT FOUND!\n";
    }
    
    if (isset($columnPositions['total_khr'])) {
        echo "✓ total_khr found at position: " . $columnPositions['total_khr'] . "\n";
    } else {
        echo "❌ total_khr column NOT FOUND!\n";
    }
    
    // 3. Test the exact INSERT statement from the API
    if (isset($columnPositions['exchange_rate']) && isset($columnPositions['total_khr'])) {
        echo "\n3. Testing INSERT statement:\n";
        
        // Prepare test data exactly as the API does
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
        
        // Use the exact same INSERT statement as the API
        $stmt = $db->prepare("
            INSERT INTO services (
                invoice_number, customer_id, vehicle_id, vehicle_model_id, service_type_id, service_date,
                current_km, volume_l, next_service_km, next_service_date, total_amount, payment_method, 
                payment_status, service_status, notes, service_detail, technician_id, 
                sales_rep_id, customer_type, booking_id, exchange_rate, total_khr, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        echo "Executing INSERT with:\n";
        echo "- exchange_rate: " . $testData['exchange_rate'] . "\n";
        echo "- total_khr: " . $testData['total_khr'] . "\n";
        
        try {
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
            
        } catch (PDOException $e) {
            echo "❌ INSERT Error: " . $e->getMessage() . "\n";
            echo "Error Code: " . $e->getCode() . "\n";
        }
        
    } else {
        echo "\n❌ Cannot test INSERT - missing required columns!\n";
    }
    
    // 4. Check recent services to see if exchange_rate and total_khr are being saved
    echo "\n4. Checking recent services:\n";
    $stmt = $db->prepare("
        SELECT id, invoice_number, total_amount, exchange_rate, total_khr, created_at 
        FROM services 
        ORDER BY id DESC 
        LIMIT 5
    ");
    $stmt->execute();
    $recentServices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($recentServices as $service) {
        echo sprintf("ID: %d, Invoice: %s, Amount: %.2f, Exchange: %s, KHR: %s, Created: %s\n",
            $service['id'],
            $service['invoice_number'],
            $service['total_amount'],
            $service['exchange_rate'] ?? 'NULL',
            $service['total_khr'] ?? 'NULL',
            $service['created_at']
        );
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>

