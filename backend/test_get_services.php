<?php
// Test getting services to find a valid service ID

echo "Testing GET services to find valid service ID...\n";

$url = 'https://api.gtvmotor.dev/api/services?limit=5';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";

if ($httpCode === 200) {
    $data = json_decode($response, true);
    if (isset($data['data']) && is_array($data['data']) && count($data['data']) > 0) {
        $firstService = $data['data'][0];
        echo "✅ Found services! First service ID: " . $firstService['id'] . "\n";
        echo "First service exchange_rate: " . ($firstService['exchange_rate'] ?? 'not set') . "\n";
        echo "First service total_khr: " . ($firstService['total_khr'] ?? 'not set') . "\n";
    } else {
        echo "❌ No services found in response\n";
    }
} else {
    echo "❌ Failed to get services\n";
}
?>
