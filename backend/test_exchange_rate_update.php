<?php
// Test script to check if exchange_rate update works
require_once 'api/services.php';

// Simulate a PUT request to update exchange_rate
$_SERVER['REQUEST_METHOD'] = 'PUT';
$_SERVER['REQUEST_URI'] = '/api/services/117';

// Mock the request body
$testData = [
    'exchange_rate' => 4565,
    'total_khr' => 251075
];

// Simulate the request body
file_put_contents('php://input', json_encode($testData));

echo "Testing exchange_rate update for service ID 117...\n";
echo "Data: " . json_encode($testData) . "\n";

// This would normally be handled by the services.php API
// But we're just testing the data structure
echo "Exchange rate: " . ($testData['exchange_rate'] ?? 'NOT_SET') . "\n";
echo "Total KHR: " . ($testData['total_khr'] ?? 'NOT_SET') . "\n";
?>
