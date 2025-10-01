<?php
/**
 * Test API Endpoints
 * GTV Motor PHP Backend
 */

echo "Testing API Endpoints...\n\n";

// Test endpoints
$endpoints = [
    'Health Check' => 'https://api.gtvmotor.dev/api/health',
    'Dashboard Alerts' => 'https://api.gtvmotor.dev/api/dashboard/alerts',
    'Alerts Notifications' => 'https://api.gtvmotor.dev/api/alerts/notifications',
    'Services' => 'https://api.gtvmotor.dev/api/services',
    'Customers' => 'https://api.gtvmotor.dev/api/customers',
    'Vehicles' => 'https://api.gtvmotor.dev/api/vehicles'
];

foreach ($endpoints as $name => $url) {
    echo "Testing: $name\n";
    echo "URL: $url\n";

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'Content-Type: application/json',
            'timeout' => 10
        ]
    ]);

    $response = @file_get_contents($url, false, $context);

    if ($response === false) {
        echo "❌ FAILED - Could not connect\n";
    } else {
        $data = json_decode($response, true);
        if ($data) {
            echo "✅ SUCCESS\n";
            echo "Response: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
        } else {
            echo "⚠️  RESPONSE NOT JSON\n";
            echo "Raw response: " . substr($response, 0, 200) . "...\n";
        }
    }

    echo str_repeat("-", 50) . "\n\n";
}

echo "API Testing Complete!\n";
?>
