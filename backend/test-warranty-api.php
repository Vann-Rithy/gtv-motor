<?php
/**
 * Test Warranty Management API
 * GTV Motor PHP Backend
 */

echo "Testing Warranty Management API...\n\n";

// Test warranty endpoints
$endpoints = [
    'Warranties API' => 'https://api.gtvmotor.dev/api/warranties',
    'Warranties Simple' => 'https://api.gtvmotor.dev/api/warranties-simple',
    'Warranties with Search' => 'https://api.gtvmotor.dev/api/warranties?search=test',
    'Warranties with Status' => 'https://api.gtvmotor.dev/api/warranties?status=active',
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
            if (isset($data['data'])) {
                echo "Warranties count: " . count($data['data']) . "\n";
                if (count($data['data']) > 0) {
                    echo "First warranty: " . json_encode($data['data'][0], JSON_PRETTY_PRINT) . "\n";
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

echo "Warranty API Testing Complete!\n";
?>
