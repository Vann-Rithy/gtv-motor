<?php
/**
 * Session and Cookie Test
 * Test session handling for /api/auth/me
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Session and Cookie Test</h2>";

// Test 1: Check if session is started
echo "<h3>1. Session Test</h3>";
if (session_status() === PHP_SESSION_NONE) {
    session_start();
    echo "✅ Session started<br>";
} else {
    echo "ℹ️ Session already active<br>";
}

// Test 2: Check cookies
echo "<h3>2. Cookie Test</h3>";
echo "Session cookie: " . ($_COOKIE['session'] ?? 'NOT SET') . "<br>";
echo "All cookies: <pre>" . print_r($_COOKIE, true) . "</pre>";

// Test 3: Check headers
echo "<h3>3. Headers Test</h3>";
echo "Authorization header: " . ($_SERVER['HTTP_AUTHORIZATION'] ?? 'NOT SET') . "<br>";
echo "All headers: <pre>" . print_r(getallheaders(), true) . "</pre>";

// Test 4: Test Auth class getCurrentUser method
echo "<h3>4. Auth getCurrentUser Test</h3>";
try {
    require_once __DIR__ . '/config/config.php';
    require_once __DIR__ . '/includes/Auth.php';

    $auth = new Auth();
    $user = $auth->getCurrentUser();

    if ($user) {
        echo "✅ User found: " . htmlspecialchars($user['email'] ?? 'Unknown') . "<br>";
    } else {
        echo "ℹ️ No user found (this is expected if not logged in)<br>";
    }

} catch (Exception $e) {
    echo "❌ Auth error: " . $e->getMessage() . "<br>";
}

echo "<h3>Test Complete</h3>";
?>
