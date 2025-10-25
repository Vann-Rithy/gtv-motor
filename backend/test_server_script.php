<?php
// Test the server script locally

echo "Testing server script locally...\n";

// Simulate POST data
$_POST['serviceId'] = '122';
$_POST['exchangeRate'] = '4025';

// Capture output
ob_start();

// Include the server script
include 'update-exchange-rate-server.php';

$output = ob_get_clean();

echo "Script output:\n";
echo $output . "\n";

// Parse JSON response
$response = json_decode($output, true);
if ($response) {
    if ($response['success']) {
        echo "✅ Exchange rate update successful!\n";
        echo "Service ID: " . $response['data']['service_id'] . "\n";
        echo "Exchange Rate: " . $response['data']['exchange_rate'] . "\n";
        echo "Total KHR: " . $response['data']['total_khr'] . "\n";
    } else {
        echo "❌ Exchange rate update failed: " . $response['error'] . "\n";
    }
} else {
    echo "❌ Invalid JSON response\n";
}
?>
