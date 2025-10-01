<?php
/**
 * Test Alerts Notifications with Recent Alerts
 * GTV Motor PHP Backend
 */

echo "Testing Alerts Notifications with Recent Alerts...\n\n";

$url = 'https://api.gtvmotor.dev/api/alerts/notifications';
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'Content-Type: application/json',
        'timeout' => 10
    ]
]);

$response = @file_get_contents($url, false, $context);
if ($response !== false) {
    $data = json_decode($response, true);
    if ($data) {
        echo "✅ SUCCESS\n";
        echo "Response structure:\n";
        echo "- success: " . ($data['success'] ? 'true' : 'false') . "\n";
        echo "- message: " . $data['message'] . "\n";
        echo "- data structure:\n";

        if (isset($data['data']['counts'])) {
            echo "  - counts: " . json_encode($data['data']['counts'], JSON_PRETTY_PRINT) . "\n";
        }

        if (isset($data['data']['recent_alerts'])) {
            echo "  - recent_alerts count: " . count($data['data']['recent_alerts']) . "\n";
            if (count($data['data']['recent_alerts']) > 0) {
                echo "  - First alert: " . json_encode($data['data']['recent_alerts'][0], JSON_PRETTY_PRINT) . "\n";
            }
        } else {
            echo "  - recent_alerts: NOT FOUND\n";
        }

        echo "\nFull response:\n";
        echo json_encode($data, JSON_PRETTY_PRINT) . "\n";
    } else {
        echo "❌ RESPONSE NOT JSON\n";
        echo "Raw response: " . substr($response, 0, 500) . "...\n";
    }
} else {
    echo "❌ FAILED - Could not connect\n";
}
?>
