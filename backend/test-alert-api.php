<?php
/**
 * Test Alert Management API Endpoints
 * GTV Motor PHP Backend
 */

echo "Testing Alert Management API Endpoints...\n\n";

// Test alert-specific endpoints
$alertEndpoints = [
    'Health Check' => 'https://api.gtvmotor.dev/api/health',
    'Dashboard Alerts' => 'https://api.gtvmotor.dev/api/dashboard/alerts',
    'Alerts Notifications' => 'https://api.gtvmotor.dev/api/alerts/notifications',
    'Dashboard Alerts with Filters' => 'https://api.gtvmotor.dev/api/dashboard/alerts?status=pending&type=service_due',
    'Dashboard Alerts with Search' => 'https://api.gtvmotor.dev/api/dashboard/alerts?search=test',
];

foreach ($alertEndpoints as $name => $url) {
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
            if (isset($data['data']['alerts'])) {
                echo "Alerts count: " . count($data['data']['alerts']) . "\n";
                if (count($data['data']['alerts']) > 0) {
                    echo "First alert: " . json_encode($data['data']['alerts'][0], JSON_PRETTY_PRINT) . "\n";
                }
            } elseif (isset($data['data']['counts'])) {
                echo "Alert counts: " . json_encode($data['data']['counts'], JSON_PRETTY_PRINT) . "\n";
            } else {
                echo "Response: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
            }
        } else {
            echo "⚠️  RESPONSE NOT JSON\n";
            echo "Raw response: " . substr($response, 0, 200) . "...\n";
        }
    }

    echo str_repeat("-", 50) . "\n\n";
}

echo "Alert Management API Testing Complete!\n";
?>
