<?php
/**
 * Create Test Vehicle and Customer for Warranty Demo
 * This script creates a test vehicle and customer to demonstrate warranty functionality
 */

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "Creating test data for warranty demonstration...\n";

    // Check if customer already exists
    $stmt = $db->prepare("SELECT id FROM customers WHERE name = 'Test Customer for Warranty'");
    $stmt->execute();
    $existingCustomer = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existingCustomer) {
        $customerId = $existingCustomer['id'];
        echo "Using existing test customer ID: $customerId\n";
    } else {
        // Create test customer
        $stmt = $db->prepare("
            INSERT INTO customers (name, phone, email, address, created_at, updated_at) 
            VALUES (?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            'Test Customer for Warranty',
            '012345678',
            'test@example.com',
            'Phnom Penh, Cambodia'
        ]);
        $customerId = $db->lastInsertId();
        echo "Created test customer with ID: $customerId\n";
    }

    // Check if vehicle already exists
    $stmt = $db->prepare("SELECT id FROM vehicles WHERE plate_number = 'TEST-101'");
    $stmt->execute();
    $existingVehicle = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existingVehicle) {
        $vehicleId = $existingVehicle['id'];
        echo "Using existing test vehicle ID: $vehicleId\n";
    } else {
        // Get first vehicle model for testing
        $stmt = $db->prepare("SELECT id FROM vehicle_models LIMIT 1");
        $stmt->execute();
        $vehicleModel = $stmt->fetch(PDO::FETCH_ASSOC);
        $vehicleModelId = $vehicleModel ? $vehicleModel['id'] : 1;

        // Create test vehicle
        $stmt = $db->prepare("
            INSERT INTO vehicles (
                customer_id, plate_number, vin_number, year, purchase_date, 
                current_km, vehicle_model_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $customerId,
            'TEST-101',
            'VIN123456789',
            2023,
            '2023-01-01',
            25000,
            $vehicleModelId
        ]);
        $vehicleId = $db->lastInsertId();
        echo "Created test vehicle with ID: $vehicleId\n";
    }

    // Update warranty to link to the test vehicle
    $stmt = $db->prepare("UPDATE warranties SET vehicle_id = ? WHERE id = 27");
    $stmt->execute([$vehicleId]);
    echo "Updated warranty ID 27 to link to vehicle ID: $vehicleId\n";

    echo "Test data setup complete!\n";
    echo "Customer ID: $customerId\n";
    echo "Vehicle ID: $vehicleId\n";
    echo "Warranty ID: 27\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>






