<?php
/**
 * API Debug Script
 * Test database connection and basic functionality
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>GTV Motor API Debug</h2>";

// Test 1: Check if environment file exists
echo "<h3>1. Environment Configuration</h3>";
if (file_exists(__DIR__ . '/.env')) {
    echo "✅ .env file exists<br>";

    // Load environment variables
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }

    echo "DB_HOST: " . ($_ENV['DB_HOST'] ?? 'NOT SET') . "<br>";
    echo "DB_NAME: " . ($_ENV['DB_NAME'] ?? 'NOT SET') . "<br>";
    echo "DB_USER: " . ($_ENV['DB_USER'] ?? 'NOT SET') . "<br>";
    echo "DB_PASSWORD: " . (empty($_ENV['DB_PASSWORD']) ? 'EMPTY' : 'SET') . "<br>";
} else {
    echo "❌ .env file not found<br>";
}

// Test 2: Check database connection
echo "<h3>2. Database Connection</h3>";
try {
    require_once __DIR__ . '/config/database.php';
    $database = new Database();

    if ($database->testConnection()) {
        echo "✅ Database connection successful<br>";

        // Test a simple query
        $conn = $database->getConnection();
        $stmt = $conn->query("SELECT COUNT(*) as count FROM users");
        $result = $stmt->fetch();
        echo "✅ Users table accessible. Count: " . $result['count'] . "<br>";

    } else {
        echo "❌ Database connection failed<br>";
    }
} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "<br>";
}

// Test 3: Check required files
echo "<h3>3. Required Files</h3>";
$requiredFiles = [
    'config/config.php',
    'config/database.php',
    'includes/Auth.php',
    'includes/Request.php',
    'includes/Response.php',
    'api/auth/login.php'
];

foreach ($requiredFiles as $file) {
    if (file_exists(__DIR__ . '/' . $file)) {
        echo "✅ $file exists<br>";
    } else {
        echo "❌ $file missing<br>";
    }
}

// Test 4: Check PHP extensions
echo "<h3>4. PHP Extensions</h3>";
$requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'openssl'];
foreach ($requiredExtensions as $ext) {
    if (extension_loaded($ext)) {
        echo "✅ $ext loaded<br>";
    } else {
        echo "❌ $ext not loaded<br>";
    }
}

// Test 5: Test login endpoint structure
echo "<h3>5. Login Endpoint Test</h3>";
try {
    // Simulate a POST request
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $_SERVER['REQUEST_URI'] = '/api/auth/login';

    // Test if we can load the login file without errors
    ob_start();
    include __DIR__ . '/api/auth/login.php';
    $output = ob_get_clean();

    echo "✅ Login endpoint loads without fatal errors<br>";
    echo "Output: " . htmlspecialchars($output) . "<br>";

} catch (Exception $e) {
    echo "❌ Login endpoint error: " . $e->getMessage() . "<br>";
}

echo "<h3>Debug Complete</h3>";
?>
