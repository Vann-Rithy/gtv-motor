<?php
/**
 * Test Vehicle Models API
 * Test the vehicle models endpoints
 */

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/includes/Request.php';
require_once __DIR__ . '/includes/Response.php';

try {
    require_once __DIR__ . '/config/database.php';
    $database = new Database();
    $db = $database->getConnection();

    echo "🧪 Testing Vehicle Models API\n";
    echo "============================\n\n";

    // Test 1: Check if vehicle_models table exists
    echo "1. Checking if vehicle_models table exists...\n";
    $stmt = $db->prepare("SHOW TABLES LIKE 'vehicle_models'");
    $stmt->execute();
    $tableExists = $stmt->fetch();

    if ($tableExists) {
        echo "✅ vehicle_models table exists\n";

        // Test 2: Check table structure
        echo "\n2. Checking table structure...\n";
        $stmt = $db->prepare("DESCRIBE vehicle_models");
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo "Columns found:\n";
        foreach ($columns as $column) {
            echo "  - {$column['Field']} ({$column['Type']})\n";
        }

        // Test 3: Check if data exists
        echo "\n3. Checking existing data...\n";
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM vehicle_models");
        $stmt->execute();
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Records in table: {$count['count']}\n";

        if ($count['count'] > 0) {
            $stmt = $db->prepare("SELECT id, name, category, base_price, cc_displacement FROM vehicle_models LIMIT 5");
            $stmt->execute();
            $models = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo "\nSample data:\n";
            foreach ($models as $model) {
                echo "  - ID: {$model['id']}, Name: {$model['name']}, Category: {$model['category']}, Price: {$model['base_price']}, CC: {$model['cc_displacement']}\n";
            }
        }

        // Test 4: Test API endpoint simulation
        echo "\n4. Testing API endpoint simulation...\n";
        $stmt = $db->prepare("
            SELECT
                id, name, description, category, base_price, estimated_duration,
                warranty_km_limit, warranty_max_services, engine_type, cc_displacement,
                fuel_type, transmission, color_options, year_range, specifications,
                is_active, created_at, updated_at
            FROM vehicle_models
            WHERE is_active = 1
            ORDER BY name ASC
        ");
        $stmt->execute();
        $models = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($models) > 0) {
            echo "✅ API query successful - found " . count($models) . " active models\n";
            echo "First model: {$models[0]['name']} ({$models[0]['category']})\n";
        } else {
            echo "⚠️  No active models found\n";
        }

    } else {
        echo "❌ vehicle_models table does not exist\n";
        echo "Please run the create_complete_vehicle_models_table.sql script first\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    error_log("Vehicle Models Test Error: " . $e->getMessage());
}

echo "\n🏁 Test completed\n";
?>
