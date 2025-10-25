<?php
// Test the PUT method for updating exchange rate

echo "Testing PUT method for exchange rate update...\n";

$url = 'https://api.gtvmotor.dev/api/services/122';
$data = [
    'exchange_rate' => 4025,
    'total_khr' => 442750
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
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
    echo "✅ Exchange rate update successful!\n";
    
    // Now test getting the service to verify the update
    echo "\nVerifying the update by fetching the service...\n";
    
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
        } else {
            echo "❌ Verification failed! Exchange rate not found or incorrect in database.\n";
        }
    }
} else {
    echo "❌ Exchange rate update failed\n";
}
?>