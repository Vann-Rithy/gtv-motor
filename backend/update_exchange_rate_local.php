<?php
// Simple script to update exchange rate for a service
// This can be run locally to update the exchange rate

echo "=== Exchange Rate Update Tool ===\n";

// Configuration
$serviceId = 120; // Change this to the service ID you want to update
$exchangeRate = 1257; // Change this to the desired exchange rate
$totalAmount = 55; // Change this to the total amount in USD
$totalKhr = $totalAmount * $exchangeRate;

echo "Service ID: $serviceId\n";
echo "Exchange Rate: $exchangeRate KHR per USD\n";
echo "Total Amount: $totalAmount USD\n";
echo "Total KHR: " . number_format($totalKhr) . " KHR\n\n";

try {
    // Database connection
    $host = 'localhost';
    $dbname = 'gtv_motor';
    $username = 'root';
    $password = '';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Database connection successful\n";
    
    // Check if service exists
    $stmt = $pdo->prepare("SELECT id, total_amount, exchange_rate, total_khr FROM services WHERE id = ?");
    $stmt->execute([$serviceId]);
    $service = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$service) {
        echo "❌ Service $serviceId not found\n";
        exit;
    }
    
    echo "✅ Service found:\n";
    echo "  Current Total Amount: $" . $service['total_amount'] . "\n";
    echo "  Current Exchange Rate: " . ($service['exchange_rate'] ?? 'NULL') . "\n";
    echo "  Current Total KHR: " . ($service['total_khr'] ?? 'NULL') . "\n\n";
    
    // Update exchange rate
    $stmt = $pdo->prepare("UPDATE services SET exchange_rate = ?, total_khr = ?, updated_at = NOW() WHERE id = ?");
    $result = $stmt->execute([$exchangeRate, $totalKhr, $serviceId]);
    
    if ($result) {
        echo "✅ Exchange rate updated successfully!\n";
        
        // Verify the update
        $stmt = $pdo->prepare("SELECT exchange_rate, total_khr FROM services WHERE id = ?");
        $stmt->execute([$serviceId]);
        $updated = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "✅ Verification:\n";
        echo "  New Exchange Rate: " . $updated['exchange_rate'] . "\n";
        echo "  New Total KHR: " . number_format($updated['total_khr']) . "\n";
    } else {
        echo "❌ Failed to update exchange rate\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
    echo "\nTo fix this:\n";
    echo "1. Make sure MySQL/MariaDB is running\n";
    echo "2. Check database credentials in this script\n";
    echo "3. Ensure the 'gtv_motor' database exists\n";
}
?>
