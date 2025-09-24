<?php
/**
 * Login Flow Test
 * Test the complete login process
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Login Flow Test</h2>";

// Test 1: Test login endpoint
echo "<h3>1. Login Endpoint Test</h3>";
try {
    // Simulate a login request
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $_SERVER['REQUEST_URI'] = '/api/auth/login';
    $_SERVER['CONTENT_TYPE'] = 'application/json';

    // Mock request body for login
    $loginData = [
        'email' => 'gtv@gmail.com',
        'password' => 'password123' // You'll need to use the actual password
    ];

    // Override file_get_contents for testing
    function mockFileGetContents($filename) {
        global $loginData;
        if ($filename === 'php://input') {
            return json_encode($loginData);
        }
        return file_get_contents($filename);
    }

    ob_start();
    include __DIR__ . '/api/auth/login.php';
    $loginOutput = ob_get_clean();

    echo "✅ Login endpoint executed<br>";
    echo "Response: " . htmlspecialchars($loginOutput) . "<br>";

} catch (Exception $e) {
    echo "❌ Login error: " . $e->getMessage() . "<br>";
}

// Test 2: Check if we can create a test user
echo "<h3>2. Test User Creation</h3>";
try {
    require_once __DIR__ . '/config/database.php';
    $database = new Database();
    $conn = $database->getConnection();

    // Check if test user exists
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute(['gtv@gmail.com']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo "✅ Test user exists: " . htmlspecialchars($user['email']) . "<br>";
        echo "User ID: " . $user['id'] . "<br>";
        echo "Role: " . $user['role'] . "<br>";
        echo "Active: " . ($user['is_active'] ? 'Yes' : 'No') . "<br>";
    } else {
        echo "❌ Test user not found<br>";
        echo "ℹ️ You may need to register a user first<br>";
    }

} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "<br>";
}

// Test 3: Test session creation
echo "<h3>3. Session Creation Test</h3>";
try {
    require_once __DIR__ . '/includes/Auth.php';
    $auth = new Auth();

    // Test session creation with a user ID
    if (isset($user) && $user) {
        $sessionId = $auth->createSession($user['id']);
        if ($sessionId) {
            echo "✅ Session created: " . substr($sessionId, 0, 10) . "...<br>";

            // Test session validation
            $validatedUser = $auth->validateSession($sessionId);
            if ($validatedUser) {
                echo "✅ Session validation successful<br>";
                echo "User: " . htmlspecialchars($validatedUser['email']) . "<br>";
            } else {
                echo "❌ Session validation failed<br>";
            }
        } else {
            echo "❌ Session creation failed<br>";
        }
    } else {
        echo "ℹ️ Skipping session test - no user found<br>";
    }

} catch (Exception $e) {
    echo "❌ Session test error: " . $e->getMessage() . "<br>";
}

echo "<h3>Login Flow Test Complete</h3>";
?>
