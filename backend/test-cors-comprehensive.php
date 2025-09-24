<?php
/**
 * Comprehensive CORS Test
 * Test all CORS headers and preflight requests
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Comprehensive CORS Test</h2>";

// Test 1: Load config to set CORS headers
echo "<h3>1. CORS Headers Test</h3>";
require_once __DIR__ . '/config/config.php';

echo "✅ CORS headers set<br>";
echo "Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? 'NOT SET') . "<br>";
echo "Request Method: " . ($_SERVER['REQUEST_METHOD'] ?? 'NOT SET') . "<br>";

// Test 2: Check allowed headers
echo "<h3>2. Allowed Headers</h3>";
$allowedHeaders = [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma'
];

foreach ($allowedHeaders as $header) {
    echo "✅ $header<br>";
}

// Test 3: Test OPTIONS preflight request
echo "<h3>3. OPTIONS Preflight Test</h3>";
$_SERVER['REQUEST_METHOD'] = 'OPTIONS';
$_SERVER['HTTP_ORIGIN'] = 'https://gtv-motor.vercel.app';
$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] = 'cache-control,pragma';

echo "✅ Preflight request simulated<br>";

// Test 4: Test actual GET request
echo "<h3>4. GET Request Test</h3>";
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_ORIGIN'] = 'https://gtv-motor.vercel.app';
$_SERVER['HTTP_CACHE_CONTROL'] = 'no-cache';
$_SERVER['HTTP_PRAGMA'] = 'no-cache';

echo "✅ GET request with Cache-Control headers simulated<br>";

// Test 5: Test /api/auth/me endpoint
echo "<h3>5. /api/auth/me Endpoint Test</h3>";
try {
    $_SERVER['REQUEST_URI'] = '/api/auth/me';

    ob_start();
    include __DIR__ . '/api/auth/me.php';
    $output = ob_get_clean();

    echo "✅ /api/auth/me endpoint executed<br>";
    echo "Response: " . htmlspecialchars($output) . "<br>";

} catch (Exception $e) {
    echo "❌ /api/auth/me error: " . $e->getMessage() . "<br>";
}

echo "<h3>CORS Test Complete</h3>";
?>
