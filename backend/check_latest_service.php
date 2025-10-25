<?php
// Check the latest service record to see if exchange rate was saved
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Checking latest service record...\n\n";
    
    // Get the latest service record
    $stmt = $db->query("
        SELECT 
            id, 
            invoice_number, 
            total_amount, 
            exchange_rate, 
            total_khr, 
            created_at,
            customer_id,
            vehicle_id
        FROM services 
        ORDER BY id DESC 
        LIMIT 1
    ");
    
    $service = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($service) {
        echo "Latest Service Record:\n";
        echo "====================\n";
        echo "ID: " . $service['id'] . "\n";
        echo "Invoice Number: " . $service['invoice_number'] . "\n";
        echo "Total Amount: $" . $service['total_amount'] . "\n";
        echo "Exchange Rate: " . ($service['exchange_rate'] ?? 'NULL') . "\n";
        echo "Total KHR: " . ($service['total_khr'] ?? 'NULL') . "\n";
        echo "Created At: " . $service['created_at'] . "\n";
        echo "Customer ID: " . $service['customer_id'] . "\n";
        echo "Vehicle ID: " . $service['vehicle_id'] . "\n";
        
        if ($service['exchange_rate'] && $service['exchange_rate'] > 0) {
            echo "\n✅ SUCCESS: Exchange rate was saved correctly!\n";
        } else {
            echo "\n❌ ISSUE: Exchange rate is NULL or 0\n";
        }
        
        if ($service['total_khr'] && $service['total_khr'] > 0) {
            echo "✅ SUCCESS: Total KHR was calculated correctly!\n";
        } else {
            echo "❌ ISSUE: Total KHR is NULL or 0\n";
        }
        
    } else {
        echo "No services found in database.\n";
    }
    
    // Also check if the columns exist
    echo "\nChecking database schema...\n";
    echo "==========================\n";
    
    $stmt = $db->query("DESCRIBE services");
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
    
    if (!$exchangeRateExists) {
        echo "❌ exchange_rate column does not exist!\n";
    }
    if (!$totalKhrExists) {
        echo "❌ total_khr column does not exist!\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
