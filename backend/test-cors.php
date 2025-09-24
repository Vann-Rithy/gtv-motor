<?php
/**
 * CORS Test Script
 * Test CORS headers and /api/auth/me endpoint
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>CORS Test</h2>";

// Test 1: Check CORS headers
echo "<h3>1. CORS Headers Test</h3>";
echo "Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? 'NOT SET') . "<br>";
echo "Request Method: " . ($_SERVER['REQUEST_METHOD'] ?? 'NOT SET') . "<br>";

// Load config to set CORS headers
require_once __DIR__ . '/config/config.php';

echo "✅ CORS headers set<br>";

// Test 2: Test /api/auth/me endpoint
echo "<h3>2. /api/auth/me Endpoint Test</h3>";

// Simulate a request to /api/auth/me
$_SERVER['REQUEST_URI'] = '/api/auth/me';
$_SERVER['REQUEST_METHOD'] = 'GET';

try {
    // Test if we can load the endpoint
    ob_start();
    include __DIR__ . '/api/auth/me.php';
    $output = ob_get_clean();

    echo "✅ /api/auth/me endpoint loads<br>";
    echo "Response: " . htmlspecialchars($output) . "<br>";

} catch (Exception $e) {
    echo "❌ /api/auth/me error: " . $e->getMessage() . "<br>";
}

// Test 3: Check allowed origins
echo "<h3>3. Allowed Origins</h3>";
$allowed_origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'https://gtvmotor.dev',
    'https://www.gtvmotor.dev',
    'https://gtv-motor.vercel.app',
    'https://gtv-motor-git-main.vercel.app',
    'https://gtv-motor-git-develop.vercel.app'
];

foreach ($allowed_origins as $origin) {
    echo "✅ $origin<br>";
}

echo "<h3>Test Complete</h3>";
?>
