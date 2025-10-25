<?php
// Simple test script to check exchange rate database operations
// This script will help us debug the issue

// Check if we can connect to database
$host = 'localhost';
$dbname = 'gtv_motor_php'; // Change this to your actual database name
$username = 'root'; // Change this to your actual username
$password = ''; // Change this to your actual password

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ Database connection successful!\n\n";
    
    // Check if columns exist
    $stmt = $pdo->query("DESCRIBE services");
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
        echo "\n❌ Missing columns! You need to run the SQL script to add them.\n";
        echo "Run this SQL:\n";
        echo "ALTER TABLE services ADD COLUMN exchange_rate decimal(8,2) DEFAULT 0.00 AFTER service_cost;\n";
        echo "ALTER TABLE services ADD COLUMN total_khr decimal(12,2) DEFAULT 0.00 AFTER exchange_rate;\n";
        exit(1);
    }
    
    // Test insert
    echo "\nTesting INSERT with exchange rate 4080...\n";
    
    $stmt = $pdo->prepare("
        INSERT INTO services (
            invoice_number, customer_id, vehicle_id, vehicle_model_id, service_type_id, service_date,
            total_amount, payment_method, payment_status, service_status, 
            exchange_rate, total_khr, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    
    $result = $stmt->execute([
        'TEST-' . time(), 1, 1, 1, 1, '2025-01-01',
        100.00, 'cash', 'pending', 'pending',
        4080.00, 408000.00
    ]);
    
    if ($result) {
        $serviceId = $pdo->lastInsertId();
        echo "✓ Test INSERT successful! Service ID: " . $serviceId . "\n";
        
        // Verify the data
        $stmt = $pdo->prepare("SELECT id, exchange_rate, total_khr FROM services WHERE id = ?");
        $stmt->execute([$serviceId]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "Retrieved data:\n";
        echo "  ID: " . $service['id'] . "\n";
        echo "  Exchange Rate: " . $service['exchange_rate'] . "\n";
        echo "  Total KHR: " . $service['total_khr'] . "\n";
        
        if ($service['exchange_rate'] == 4080 && $service['total_khr'] == 408000) {
            echo "✓ Data verification successful!\n";
        } else {
            echo "❌ Data verification failed!\n";
        }
        
        // Clean up
        $stmt = $pdo->prepare("DELETE FROM services WHERE id = ?");
        $stmt->execute([$serviceId]);
        echo "✓ Test data cleaned up.\n";
        
    } else {
        echo "❌ Test INSERT failed!\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
    echo "\nPlease check:\n";
    echo "1. MySQL server is running\n";
    echo "2. Database credentials are correct\n";
    echo "3. Database name exists\n";
}
?>
