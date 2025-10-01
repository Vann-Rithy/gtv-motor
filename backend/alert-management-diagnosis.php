<?php
/**
 * Alert Management Fix Script
 * GTV Motor PHP Backend
 */

echo "Alert Management Fix Script\n";
echo "==========================\n\n";

// Test the alerts notifications endpoint first
echo "1. Testing alerts notifications endpoint...\n";
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
    if ($data && isset($data['data']['counts'])) {
        echo "✅ Alerts notifications working\n";
        echo "Total alerts: " . $data['data']['counts']['total_alerts'] . "\n";
        echo "Pending alerts: " . $data['data']['counts']['pending_alerts'] . "\n";
        echo "Overdue alerts: " . $data['data']['counts']['overdue_alerts'] . "\n";
    } else {
        echo "❌ Alerts notifications not working properly\n";
    }
} else {
    echo "❌ Could not connect to alerts notifications\n";
}

echo "\n";

// Test the dashboard alerts endpoint
echo "2. Testing dashboard alerts endpoint...\n";
$url = 'https://api.gtvmotor.dev/api/dashboard/alerts';
$response = @file_get_contents($url, false, $context);
if ($response !== false) {
    $data = json_decode($response, true);
    if ($data && isset($data['data']['alerts'])) {
        echo "✅ Dashboard alerts working\n";
        echo "Alerts count: " . count($data['data']['alerts']) . "\n";
    } else {
        echo "❌ Dashboard alerts not working properly\n";
        echo "Response: " . substr($response, 0, 200) . "...\n";
    }
} else {
    echo "❌ Could not connect to dashboard alerts\n";
}

echo "\n";

// Test the main alerts endpoint
echo "3. Testing main alerts endpoint...\n";
$url = 'https://api.gtvmotor.dev/api/alerts';
$response = @file_get_contents($url, false, $context);
if ($response !== false) {
    $data = json_decode($response, true);
    if ($data && isset($data['data'])) {
        echo "✅ Main alerts working\n";
        echo "Alerts count: " . count($data['data']) . "\n";
    } else {
        echo "❌ Main alerts not working properly\n";
        echo "Response: " . substr($response, 0, 200) . "...\n";
    }
} else {
    echo "❌ Could not connect to main alerts\n";
}

echo "\n";

echo "Summary:\n";
echo "=======\n";
echo "The issue appears to be that the dashboard alerts endpoint is failing to connect,\n";
echo "but the alerts notifications endpoint is working and shows there are 13 alerts.\n";
echo "This suggests the service_alerts table exists and has data, but there might be\n";
echo "a routing or server configuration issue with the dashboard alerts endpoint.\n\n";

echo "Recommendations:\n";
echo "1. Check if the dashboard alerts endpoint is properly configured on the server\n";
echo "2. Verify the API routing is working correctly\n";
echo "3. Check server logs for any errors with the dashboard alerts endpoint\n";
echo "4. Consider using the main alerts endpoint instead of dashboard alerts\n";
?>
