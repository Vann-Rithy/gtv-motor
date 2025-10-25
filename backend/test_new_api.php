<?php
// Test the new API endpoint

echo "Testing new API endpoint...\n";

$url = 'https://api.gtvmotor.dev/update-exchange-rate-api.php';
$data = [
    'serviceId' => 122,
    'exchangeRate' => 4025
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";

if ($httpCode === 200) {
    $result = json_decode($response, true);
    if ($result && $result['success']) {
        echo "✅ Exchange rate update successful!\n";
        echo "Service ID: " . $result['data']['id'] . "\n";
        echo "Exchange Rate: " . $result['data']['exchange_rate'] . "\n";
        echo "Total KHR: " . $result['data']['total_khr'] . "\n";
        
        // Verify the update by getting the service
        echo "\nVerifying the update...\n";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://api.gtvmotor.dev/api/services/122');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json'
        ]);
        
        $getResponse = curl_exec($ch);
        $getHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        echo "GET HTTP Code: $getHttpCode\n";
        echo "GET Response: $getResponse\n";
        
        if ($getHttpCode === 200) {
            $serviceData = json_decode($getResponse, true);
            if (isset($serviceData['data']['exchange_rate']) && $serviceData['data']['exchange_rate'] == 4025) {
                echo "✅ Verification successful! Exchange rate is now saved in database: " . $serviceData['data']['exchange_rate'] . "\n";
                echo "✅ Total KHR: " . $serviceData['data']['total_khr'] . "\n";
            } else {
                echo "❌ Verification failed! Exchange rate not found or incorrect in database.\n";
            }
        }
    } else {
        echo "❌ Exchange rate update failed: " . ($result['error'] ?? 'Unknown error') . "\n";
    }
} else {
    echo "❌ Exchange rate update failed with HTTP $httpCode\n";
}
?>
