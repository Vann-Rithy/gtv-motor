<?php
// Test script to check if service 119 exists in database

echo "Testing service 119 existence...\n";

try {
    $host = 'localhost';
    $dbname = 'gtv_motor';
    $username = 'root';
    $password = '';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Database connection successful\n";
    
    // Test the exact query used in PUT method
    $stmt = $pdo->prepare("SELECT id FROM services WHERE id = ?");
    $stmt->execute([119]);
    $result = $stmt->fetch();
    
    if ($result) {
        echo "✅ Service 119 exists in database\n";
        echo "Service ID: " . $result['id'] . "\n";
    } else {
        echo "❌ Service 119 does not exist in database\n";
        
        // Check latest services
        $stmt = $pdo->prepare("SELECT id, invoice_number FROM services ORDER BY id DESC LIMIT 5");
        $stmt->execute();
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "Latest 5 services:\n";
        foreach ($services as $s) {
            echo "  ID: " . $s['id'] . ", Invoice: " . $s['invoice_number'] . "\n";
        }
    }
    
} catch (PDOException $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
}
?>
