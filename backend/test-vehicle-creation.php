<?php
/**
 * Test Vehicle Creation
 */

// Set production environment for testing
$_ENV['DB_HOST'] = 'localhost';
$_ENV['DB_NAME'] = 'gtvmnwkc_db';
$_ENV['DB_USER'] = 'gtvmnwkc_admin';
$_ENV['DB_PASSWORD'] = '}dSNZYD@@b40';
$_ENV['DB_PORT'] = '3306';

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/Request.php';
require_once __DIR__ . '/includes/Response.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "Database connection: SUCCESS\n";

    // Test data
    $testData = [
        'customer_id' => 50,
        'plate_number' => 'TEST-123',
        'model' => 'SOBEN',
        'year' => 2024
    ];

    echo "Test data: " . json_encode($testData) . "\n";

    // Check if customer exists
    $stmt = $db->prepare("SELECT id FROM customers WHERE id = ?");
    $stmt->execute([$testData['customer_id']]);
    $customer = $stmt->fetch();

    if (!$customer) {
        echo "ERROR: Customer not found\n";
        exit;
    }
    echo "Customer exists: YES\n";

    // Check if plate number already exists
    $stmt = $db->prepare("SELECT id FROM vehicles WHERE plate_number = ?");
    $stmt->execute([$testData['plate_number']]);
    $existingVehicle = $stmt->fetch();

    if ($existingVehicle) {
        echo "ERROR: Vehicle with this plate number already exists\n";
        exit;
    }
    echo "Plate number available: YES\n";

    // Check if model exists in vehicle_models
    $stmt = $db->prepare("SELECT id FROM vehicle_models WHERE name = ?");
    $stmt->execute([$testData['model']]);
    $vehicleModel = $stmt->fetch(PDO::FETCH_ASSOC);
    $vehicleModelId = $vehicleModel ? $vehicleModel['id'] : null;

    echo "Vehicle model ID: " . ($vehicleModelId ?: 'NULL') . "\n";

    // Try to insert
    $stmt = $db->prepare("
        INSERT INTO vehicles (
            customer_id, plate_number, model, vehicle_model_id, year,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    ");

    $result = $stmt->execute([
        $testData['customer_id'],
        $testData['plate_number'],
        $testData['model'],
        $vehicleModelId,
        $testData['year']
    ]);

    if ($result) {
        $vehicleId = $db->lastInsertId();
        echo "SUCCESS: Vehicle created with ID: $vehicleId\n";

        // Clean up test data
        $stmt = $db->prepare("DELETE FROM vehicles WHERE id = ?");
        $stmt->execute([$vehicleId]);
        echo "Test data cleaned up\n";
    } else {
        echo "ERROR: Failed to insert vehicle\n";
        print_r($stmt->errorInfo());
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>

