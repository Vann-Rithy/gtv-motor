<?php
// Test the new exchange rate update endpoint

echo "Testing new exchange rate update endpoint...\n";

$url = 'https://api.gtvmotor.dev/api/update-exchange-rate';
$data = [
    'service_id' => 120,
    'exchange_rate' => 1257,
    'total_khr' => 69135
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
    echo "✅ Exchange rate update successful!\n";
} else {
    echo "❌ Exchange rate update failed\n";
}
?>
