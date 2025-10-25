<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if columns exist
    $stmt = $db->query('DESCRIBE services');
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Services table columns:\n";
    foreach ($columns as $column) {
        echo $column['Field'] . ' - ' . $column['Type'] . ' - Default: ' . $column['Default'] . "\n";
    }
    
    // Check if exchange_rate and total_khr columns exist
    $exchangeRateExists = false;
    $totalKhrExists = false;
    
    foreach ($columns as $column) {
        if ($column['Field'] === 'exchange_rate') {
            $exchangeRateExists = true;
            echo "\nExchange Rate Column Found: " . $column['Type'] . " Default: " . $column['Default'] . "\n";
        }
        if ($column['Field'] === 'total_khr') {
            $totalKhrExists = true;
            echo "Total KHR Column Found: " . $column['Type'] . " Default: " . $column['Default'] . "\n";
        }
    }
    
    if (!$exchangeRateExists) {
        echo "\nERROR: exchange_rate column does not exist!\n";
    }
    if (!$totalKhrExists) {
        echo "ERROR: total_khr column does not exist!\n";
    }
    
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . "\n";
}
?>
