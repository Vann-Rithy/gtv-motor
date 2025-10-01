<?php
/**
 * Test Current Alert API Endpoints
 * GTV Motor PHP Backend
 */

echo "Testing Current Alert API Endpoints...\n\n";

// Test different possible endpoints
$endpoints = [
    'Alerts Notifications' => 'https://api.gtvmotor.dev/api/alerts/notifications',
    'Main Alerts' => 'https://api.gtvmotor.dev/api/alerts',
    'Dashboard Alerts' => 'https://api.gtvmotor.dev/api/dashboard/alerts',
    'Alerts with Limit' => 'https://api.gtvmotor.dev/api/alerts/notifications?limit=10',
    'Alerts with Status' => 'https://api.gtvmotor.dev/api/alerts/notifications?status=pending',
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
            if (isset($data['data']['recent_alerts'])) {
                echo "Recent alerts count: " . count($data['data']['recent_alerts']) . "\n";
                if (count($data['data']['recent_alerts']) > 0) {
                    echo "First alert: " . json_encode($data['data']['recent_alerts'][0], JSON_PRETTY_PRINT) . "\n";
                }
            } elseif (isset($data['data']['alerts'])) {
                echo "Alerts count: " . count($data['data']['alerts']) . "\n";
                if (count($data['data']['alerts']) > 0) {
                    echo "First alert: " . json_encode($data['data']['alerts'][0], JSON_PRETTY_PRINT) . "\n";
                }
            } elseif (isset($data['data'])) {
                echo "Data count: " . count($data['data']) . "\n";
                if (count($data['data']) > 0) {
                    echo "First item: " . json_encode($data['data'][0], JSON_PRETTY_PRINT) . "\n";
                }
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

echo "API Testing Complete!\n";
?>
