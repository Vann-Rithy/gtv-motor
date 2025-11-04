<?php
/**
 * Test script to simulate the exact frontend request
 * This will help us see what's happening when the frontend sends exchange rate data
 */

require_once 'config/config.php';
require_once 'config/database.php';

// Set up error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "=== FRONTEND SIMULATION TEST ===\n";
    echo "Simulating the exact data sent from frontend...\n\n";
    
    // Simulate the exact payload from the frontend console logs
    $frontendPayload = [
        'customer_id' => 92,
        'vehicle_id' => 142,
        'service_type_id' => 14,
        'service_date' => '2025-10-25',
        'current_km' => null,
        'volume_l' => null,
        'next_service_km' => null,
        'next_service_date' => null,
        'total_amount' => 55,
        'payment_method' => 'cash',
        'service_status' => 'pending',
        'payment_status' => 'pending',
        'technician_id' => null,
        'sales_rep_id' => null,
        'notes' => null,
        'service_detail' => 'Test service detail',
        'customer_type' => 'walking',
        'booking_id' => null,
        'discount_amount' => 0,
        'discount_type' => 'percentage',
        'discount_value' => 0,
        'vat_rate' => 10,
        'vat_amount' => 5,
        'subtotal' => 50,
        'exchange_rate' => 7896,
        'total_khr' => 434280
    ];
    
    echo "Frontend payload:\n";
    echo json_encode($frontendPayload, JSON_PRETTY_PRINT) . "\n\n";
    
    // Process the data exactly as the API does
    $data = $frontendPayload;
    
    $customerId = (int)$data['customer_id'];
    $vehicleId = (int)$data['vehicle_id'];
    $serviceTypeId = (int)$data['service_type_id'];
    $serviceDate = $data['service_date'];
    $currentKm = isset($data['current_km']) ? (int)$data['current_km'] : null;
    $volumeL = isset($data['volume_l']) ? (float)$data['volume_l'] : null;
    $totalAmount = (float)$data['total_amount'];
    $paymentMethod = $data['payment_method'];
    $paymentStatus = $data['payment_status'];
    $serviceStatus = $data['service_status'];
    $notes = $data['notes'];
    $serviceDetail = $data['service_detail'];
    $nextServiceKm = isset($data['next_service_km']) ? (int)$data['next_service_km'] : null;
    $nextServiceDate = $data['next_service_date'] ?? null;
    $technicianId = isset($data['technician_id']) ? (int)$data['technician_id'] : null;
    $salesRepId = isset($data['sales_rep_id']) ? (int)$data['sales_rep_id'] : null;
    $customerType = $data['customer_type'];
    $bookingId = isset($data['booking_id']) ? (int)$data['booking_id'] : null;
    
    // Invoice and discount fields
    $discountAmount = isset($data['discount_amount']) ? (float)$data['discount_amount'] : 0.00;
    $discountType = $data['discount_type'] ?? 'percentage';
    $discountValue = isset($data['discount_value']) ? (float)$data['discount_value'] : 0.00;
    $vatRate = isset($data['vat_rate']) ? (float)$data['vat_rate'] : 10.00;
    $vatAmount = isset($data['vat_amount']) ? (float)$data['vat_amount'] : 0.00;
    $subtotal = isset($data['subtotal']) ? (float)$data['subtotal'] : $totalAmount;
    $exchangeRate = isset($data['exchange_rate']) ? (float)$data['exchange_rate'] : 0.00;
    $totalKhr = isset($data['total_khr']) ? (float)$data['total_khr'] : ($totalAmount * $exchangeRate);
    
    echo "Processed values:\n";
    echo "- exchangeRate: " . $exchangeRate . "\n";
    echo "- totalKhr: " . $totalKhr . "\n";
    echo "- totalAmount: " . $totalAmount . "\n\n";
    
    // Generate invoice number
    $year = date('y');
    $month = date('m');
    $day = date('d');
    $random = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
    $invoiceNumber = "TEST-{$year}{$month}{$day}-{$random}";
    
    // Get vehicle_model_id (simulate the API logic)
    $stmt = $db->prepare("SELECT id, vehicle_model_id FROM vehicles WHERE id = ?");
    $stmt->execute([$vehicleId]);
    $vehicle = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$vehicle) {
        echo "❌ Vehicle not found!\n";
        exit;
    }
    $vehicleModelId = $vehicle['vehicle_model_id'];
    
    echo "Vehicle model ID: " . $vehicleModelId . "\n\n";
    
    // Test the exact INSERT statement
    echo "Testing INSERT statement...\n";
    
    $stmt = $db->prepare("
        INSERT INTO services (
            invoice_number, customer_id, vehicle_id, vehicle_model_id, service_type_id, service_date,
            current_km, volume_l, next_service_km, next_service_date, total_amount, payment_method, 
            payment_status, service_status, notes, service_detail, technician_id, 
            sales_rep_id, customer_type, booking_id, exchange_rate, total_khr, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    
    try {
        $result = $stmt->execute([
            $invoiceNumber, $customerId, $vehicleId, $vehicleModelId, $serviceTypeId, $serviceDate,
            $currentKm, $volumeL, $nextServiceKm, $nextServiceDate, $totalAmount, $paymentMethod,
            $paymentStatus, $serviceStatus, $notes, $serviceDetail, $technicianId,
            $salesRepId, $customerType, $bookingId, $exchangeRate, $totalKhr
        ]);
        
        if ($result) {
            $serviceId = $db->lastInsertId();
            echo "✓ INSERT successful! Service ID: " . $serviceId . "\n";
            
            // Verify the data
            $stmt = $db->prepare("SELECT id, exchange_rate, total_khr, total_amount FROM services WHERE id = ?");
            $stmt->execute([$serviceId]);
            $service = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo "Retrieved data:\n";
            echo "- ID: " . $service['id'] . "\n";
            echo "- Total Amount: " . $service['total_amount'] . "\n";
            echo "- Exchange Rate: " . $service['exchange_rate'] . "\n";
            echo "- Total KHR: " . $service['total_khr'] . "\n";
            
            if ($service['exchange_rate'] == 7896 && $service['total_khr'] == 434280) {
                echo "✓ SUCCESS: Exchange rate data saved correctly!\n";
            } else {
                echo "❌ FAILURE: Exchange rate data not saved correctly!\n";
                echo "Expected: exchange_rate=7896, total_khr=434280\n";
                echo "Actual: exchange_rate=" . $service['exchange_rate'] . ", total_khr=" . $service['total_khr'] . "\n";
            }
            
            // Clean up
            $stmt = $db->prepare("DELETE FROM services WHERE id = ?");
            $stmt->execute([$serviceId]);
            echo "✓ Test data cleaned up.\n";
            
        } else {
            echo "❌ INSERT failed!\n";
        }
        
    } catch (PDOException $e) {
        echo "❌ INSERT Error: " . $e->getMessage() . "\n";
        echo "Error Code: " . $e->getCode() . "\n";
        echo "SQL State: " . $e->errorInfo[0] . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>




