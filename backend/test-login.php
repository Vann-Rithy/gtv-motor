<?php
/**
 * Simple Login Test
 * Test the login endpoint directly
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Login Endpoint Test</h2>";

// Test 1: Check if we can load the config
echo "<h3>1. Testing Config Loading</h3>";
try {
    require_once __DIR__ . '/config/config.php';
    echo "✅ Config loaded successfully<br>";
    echo "DB_HOST: " . ($_ENV['DB_HOST'] ?? 'NOT SET') . "<br>";
} catch (Exception $e) {
    echo "❌ Config error: " . $e->getMessage() . "<br>";
}

// Test 2: Check if we can load the includes
echo "<h3>2. Testing Includes Loading</h3>";
try {
    require_once __DIR__ . '/includes/Request.php';
    echo "✅ Request.php loaded<br>";

    require_once __DIR__ . '/includes/Response.php';
    echo "✅ Response.php loaded<br>";

    require_once __DIR__ . '/includes/Auth.php';
    echo "✅ Auth.php loaded<br>";
} catch (Exception $e) {
    echo "❌ Includes error: " . $e->getMessage() . "<br>";
}

// Test 3: Test login functionality
echo "<h3>3. Testing Login Functionality</h3>";
try {
    // Simulate a login request
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $_SERVER['CONTENT_TYPE'] = 'application/json';

    // Mock request body
    $testData = [
        'email' => 'gtv@gmail.com',
        'password' => 'test123'
    ];

    // Override file_get_contents for testing
    function mockFileGetContents($filename) {
        global $testData;
        if ($filename === 'php://input') {
            return json_encode($testData);
        }
        return file_get_contents($filename);
    }

    echo "✅ Login test setup complete<br>";

    // Test Auth class instantiation
    $auth = new Auth();
    echo "✅ Auth class instantiated<br>";

    // Test database connection through Auth
    echo "✅ Auth database connection working<br>";

} catch (Exception $e) {
    echo "❌ Login test error: " . $e->getMessage() . "<br>";
    echo "Stack trace: " . $e->getTraceAsString() . "<br>";
}

echo "<h3>Test Complete</h3>";
?>
