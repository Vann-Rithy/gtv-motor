<?php
/**
 * Test Database Connection and Vehicle Models
 */

require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "Database connection: SUCCESS\n";

    // Check if vehicle_models table exists
    $stmt = $db->prepare("SHOW TABLES LIKE 'vehicle_models'");
    $stmt->execute();
    $tableExists = $stmt->fetch();

    if ($tableExists) {
        echo "vehicle_models table: EXISTS\n";

        // Check table structure
        $stmt = $db->prepare("DESCRIBE vehicle_models");
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo "Table structure:\n";
        foreach ($columns as $column) {
            echo "- {$column['Field']}: {$column['Type']}\n";
        }

        // Check data
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM vehicle_models");
        $stmt->execute();
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Records count: {$count['count']}\n";

        // Show sample data
        $stmt = $db->prepare("SELECT id, name, category FROM vehicle_models LIMIT 5");
        $stmt->execute();
        $models = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo "Sample data:\n";
        foreach ($models as $model) {
            echo "- ID: {$model['id']}, Name: {$model['name']}, Category: {$model['category']}\n";
        }

    } else {
        echo "vehicle_models table: NOT EXISTS\n";
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>

