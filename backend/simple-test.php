<?php
/**
 * Simple CORS and Me Endpoint Test
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Simple CORS and Me Test</h2>";

// Test 1: Basic CORS headers
echo "<h3>1. CORS Headers</h3>";
require_once __DIR__ . '/config/config.php';
echo "✅ Config loaded<br>";

// Test 2: Check if /api/auth/me file exists and is accessible
echo "<h3>2. Me Endpoint File Check</h3>";
$meFile = __DIR__ . '/api/auth/me.php';
if (file_exists($meFile)) {
    echo "✅ /api/auth/me.php file exists<br>";

    // Check file permissions
    if (is_readable($meFile)) {
        echo "✅ File is readable<br>";
    } else {
        echo "❌ File is not readable<br>";
    }
} else {
    echo "❌ /api/auth/me.php file not found<br>";
}

// Test 3: Test Auth class
echo "<h3>3. Auth Class Test</h3>";
try {
    require_once __DIR__ . '/includes/Auth.php';
    $auth = new Auth();
    echo "✅ Auth class instantiated<br>";
} catch (Exception $e) {
    echo "❌ Auth class error: " . $e->getMessage() . "<br>";
}

// Test 4: Test database connection
echo "<h3>4. Database Connection Test</h3>";
try {
    require_once __DIR__ . '/config/database.php';
    $database = new Database();
    $conn = $database->getConnection();
    echo "✅ Database connection successful<br>";
} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "<br>";
}

// Test 5: Test Response class
echo "<h3>5. Response Class Test</h3>";
try {
    require_once __DIR__ . '/includes/Response.php';
    echo "✅ Response class loaded<br>";
} catch (Exception $e) {
    echo "❌ Response class error: " . $e->getMessage() . "<br>";
}

echo "<h3>Test Complete</h3>";
?>
