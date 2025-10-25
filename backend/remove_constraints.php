<?php
/**
 * Script to remove unique constraints from database
 */

require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Removing unique constraints from database...\n";
    
    // Remove unique constraints from customers table
    echo "\n1. Removing constraints from customers table...\n";
    
    $constraints = [
        'unique_phone',
        'unique_email', 
        'unique_customer',
        'unique_customer_phone'
    ];
    
    foreach ($constraints as $constraint) {
        try {
            $stmt = $db->prepare("ALTER TABLE `customers` DROP INDEX IF EXISTS `{$constraint}`");
            $stmt->execute();
            echo "   - Dropped constraint: {$constraint}\n";
        } catch (Exception $e) {
            echo "   - Constraint {$constraint} not found or already removed\n";
        }
    }
    
    // Add regular indexes for better performance
    echo "\n2. Adding regular indexes for performance...\n";
    
    $indexes = [
        'idx_phone' => 'phone',
        'idx_email' => 'email'
    ];
    
    foreach ($indexes as $indexName => $column) {
        try {
            $stmt = $db->prepare("ALTER TABLE `customers` ADD INDEX `{$indexName}` (`{$column}`)");
            $stmt->execute();
            echo "   - Added index: {$indexName} on {$column}\n";
        } catch (Exception $e) {
            echo "   - Index {$indexName} already exists\n";
        }
    }
    
    // Remove unique constraints from vehicles table
    echo "\n3. Removing constraints from vehicles table...\n";
    
    $vehicleConstraints = [
        'unique_customer_plate',
        'unique_plate_number',
        'unique_customer_vin',
        'unique_vin_number',
        'unique_vehicle',
        'unique_plate',
        'unique_vin'
    ];
    
    foreach ($vehicleConstraints as $constraint) {
        try {
            $stmt = $db->prepare("ALTER TABLE `vehicles` DROP INDEX IF EXISTS `{$constraint}`");
            $stmt->execute();
            echo "   - Dropped constraint: {$constraint}\n";
        } catch (Exception $e) {
            echo "   - Constraint {$constraint} not found or already removed\n";
        }
    }
    
    // Add regular indexes for vehicles
    echo "\n4. Adding regular indexes for vehicles...\n";
    
    $vehicleIndexes = [
        'idx_plate_number' => 'plate_number',
        'idx_vin_number' => 'vin_number',
        'idx_customer_plate' => 'customer_id, plate_number',
        'idx_customer_vin' => 'customer_id, vin_number'
    ];
    
    foreach ($vehicleIndexes as $indexName => $columns) {
        try {
            $stmt = $db->prepare("ALTER TABLE `vehicles` ADD INDEX `{$indexName}` (`{$columns}`)");
            $stmt->execute();
            echo "   - Added index: {$indexName} on {$columns}\n";
        } catch (Exception $e) {
            echo "   - Index {$indexName} already exists\n";
        }
    }
    
    // Show current indexes
    echo "\n5. Current indexes on customers table:\n";
    $stmt = $db->prepare("SHOW INDEX FROM `customers`");
    $stmt->execute();
    $indexes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($indexes as $index) {
        echo "   - {$index['Key_name']} on {$index['Column_name']} (Unique: " . ($index['Non_unique'] ? 'No' : 'Yes') . ")\n";
    }
    
    echo "\n6. Current indexes on vehicles table:\n";
    $stmt = $db->prepare("SHOW INDEX FROM `vehicles`");
    $stmt->execute();
    $indexes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($indexes as $index) {
        echo "   - {$index['Key_name']} on {$index['Column_name']} (Unique: " . ($index['Non_unique'] ? 'No' : 'Yes') . ")\n";
    }
    
    echo "\n✅ All unique constraints have been removed!\n";
    echo "✅ Users can now upload duplicate data without restrictions!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>
