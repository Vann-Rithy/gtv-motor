<?php
/**
 * Comprehensive Exchange Rate Debug Script
 * This script will help us identify exactly what's happening with the exchange rate data
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

// Set up logging
$logFile = 'exchange_rate_debug.log';
file_put_contents($logFile, "=== EXCHANGE RATE DEBUG SESSION STARTED ===\n", FILE_APPEND);

function logMessage($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $message\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);
    echo $logEntry;
}

try {
    logMessage("Starting exchange rate debug session");
    
    // Load configuration
    require_once 'config/config.php';
    require_once 'config/database.php';
    
    logMessage("Configuration loaded successfully");
    
    // Test database connection
    $database = new Database();
    $db = $database->getConnection();
    
    logMessage("Database connection established");
    
    // 1. Check if columns exist
    logMessage("Checking if exchange_rate and total_khr columns exist...");
    
    $stmt = $db->query("DESCRIBE services");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $exchangeRateExists = false;
    $totalKhrExists = false;
    $columnDetails = [];
    
    foreach ($columns as $column) {
        $columnDetails[$column['Field']] = $column;
        if ($column['Field'] === 'exchange_rate') {
            $exchangeRateExists = true;
            logMessage("✓ exchange_rate column found: " . json_encode($column));
        }
        if ($column['Field'] === 'total_khr') {
            $totalKhrExists = true;
            logMessage("✓ total_khr column found: " . json_encode($column));
        }
    }
    
    if (!$exchangeRateExists) {
        logMessage("❌ exchange_rate column NOT FOUND!");
    }
    if (!$totalKhrExists) {
        logMessage("❌ total_khr column NOT FOUND!");
    }
    
    // 2. Check recent services to see current state
    logMessage("Checking recent services...");
    
    $stmt = $db->prepare("
        SELECT id, invoice_number, total_amount, exchange_rate, total_khr, created_at 
        FROM services 
        ORDER BY id DESC 
        LIMIT 5
    ");
    $stmt->execute();
    $recentServices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($recentServices as $service) {
        logMessage("Service ID {$service['id']}: Amount={$service['total_amount']}, Exchange={$service['exchange_rate']}, KHR={$service['total_khr']}");
    }
    
    // 3. Test INSERT with exact frontend data
    if ($exchangeRateExists && $totalKhrExists) {
        logMessage("Testing INSERT with frontend data...");
        
        // Simulate the exact data from console logs
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
            'total_amount' => 55.00,
            'payment_method' => 'cash',
            'payment_status' => 'pending',
            'service_status' => 'pending',
            'notes' => 'Debug test',
            'service_detail' => 'Debug test service',
            'technician_id' => null,
            'sales_rep_id' => null,
            'customer_type' => 'walking',
            'booking_id' => null,
            'exchange_rate' => 7896.00,
            'total_khr' => 434280.00
        ];
        
        logMessage("Test data: " . json_encode($testData));
        
        // Use the exact INSERT statement from the API
        $stmt = $db->prepare("
            INSERT INTO services (
                invoice_number, customer_id, vehicle_id, vehicle_model_id, service_type_id, service_date,
                current_km, volume_l, next_service_km, next_service_date, total_amount, payment_method, 
                payment_status, service_status, notes, service_detail, technician_id, 
                sales_rep_id, customer_type, booking_id, exchange_rate, total_khr, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
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
                logMessage("✓ INSERT successful! Service ID: $serviceId");
                
                // Verify the data
                $stmt = $db->prepare("SELECT id, exchange_rate, total_khr, total_amount FROM services WHERE id = ?");
                $stmt->execute([$serviceId]);
                $service = $stmt->fetch(PDO::FETCH_ASSOC);
                
                logMessage("Retrieved data: " . json_encode($service));
                
                if ($service['exchange_rate'] == 7896 && $service['total_khr'] == 434280) {
                    logMessage("✓ SUCCESS: Exchange rate data saved correctly!");
                } else {
                    logMessage("❌ FAILURE: Exchange rate data not saved correctly!");
                    logMessage("Expected: exchange_rate=7896, total_khr=434280");
                    logMessage("Actual: exchange_rate={$service['exchange_rate']}, total_khr={$service['total_khr']}");
                }
                
                // Clean up
                $stmt = $db->prepare("DELETE FROM services WHERE id = ?");
                $stmt->execute([$serviceId]);
                logMessage("✓ Test data cleaned up");
                
            } else {
                logMessage("❌ INSERT failed - no error thrown but result is false");
            }
            
        } catch (PDOException $e) {
            logMessage("❌ INSERT Error: " . $e->getMessage());
            logMessage("Error Code: " . $e->getCode());
            logMessage("SQL State: " . $e->errorInfo[0]);
        }
        
    } else {
        logMessage("❌ Cannot test INSERT - missing required columns");
    }
    
    // 4. Check for any database constraints or triggers
    logMessage("Checking for constraints and triggers...");
    
    $stmt = $db->query("SHOW CREATE TABLE services");
    $createTable = $stmt->fetch(PDO::FETCH_ASSOC);
    logMessage("Table structure: " . $createTable['Create Table']);
    
    logMessage("=== DEBUG SESSION COMPLETED ===");
    
} catch (Exception $e) {
    logMessage("❌ Fatal Error: " . $e->getMessage());
    logMessage("Stack trace: " . $e->getTraceAsString());
}

echo "\nDebug session completed. Check the log file: exchange_rate_debug.log\n";
?>






