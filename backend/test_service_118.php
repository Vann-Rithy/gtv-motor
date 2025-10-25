<?php
// Test script to check service 118 existence and database connection

echo "Testing service 118 existence...\n";

// Test database connection
try {
    $host = 'localhost';
    $dbname = 'gtv_motor';
    $username = 'root';
    $password = '';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Database connection successful\n";
    
    // Check if service 118 exists
    $stmt = $pdo->prepare("SELECT id, invoice_number, total_amount, exchange_rate, total_khr FROM services WHERE id = 118");
    $stmt->execute();
    $service = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($service) {
        echo "✅ Service 118 exists:\n";
        echo "  ID: " . $service['id'] . "\n";
        echo "  Invoice: " . $service['invoice_number'] . "\n";
        echo "  Total Amount: " . $service['total_amount'] . "\n";
        echo "  Exchange Rate: " . ($service['exchange_rate'] ?? 'NULL') . "\n";
        echo "  Total KHR: " . ($service['total_khr'] ?? 'NULL') . "\n";
    } else {
        echo "❌ Service 118 does not exist\n";
        
        // Check latest services
        $stmt = $pdo->prepare("SELECT id, invoice_number, total_amount, exchange_rate, total_khr FROM services ORDER BY id DESC LIMIT 5");
        $stmt->execute();
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "Latest 5 services:\n";
        foreach ($services as $s) {
            echo "  ID: " . $s['id'] . ", Invoice: " . $s['invoice_number'] . ", Exchange Rate: " . ($s['exchange_rate'] ?? 'NULL') . "\n";
        }
    }
    
} catch (PDOException $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
}
?>
