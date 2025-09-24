<?php
/**
 * Session Cookie Test
 * Test if session cookies are being set correctly
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Session Cookie Test</h2>";

// Test 1: Check current cookies
echo "<h3>1. Current Cookies</h3>";
echo "Session cookie: " . ($_COOKIE['session'] ?? 'NOT SET') . "<br>";
echo "All cookies: <pre>" . print_r($_COOKIE, true) . "</pre>";

// Test 2: Test login and cookie setting
echo "<h3>2. Login and Cookie Test</h3>";
echo "<form method='POST' action=''>";
echo "<input type='hidden' name='action' value='test_login_cookie'>";
echo "<input type='email' name='email' placeholder='Email' value='admin@rhtower.com'><br><br>";
echo "<input type='password' name='password' placeholder='Password'><br><br>";
echo "<button type='submit'>Test Login & Cookie</button>";
echo "</form>";

// Handle login test
if ($_POST['action'] === 'test_login_cookie') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    echo "<h3>Login Test Results:</h3>";

    try {
        require_once __DIR__ . '/includes/Auth.php';
        $auth = new Auth();

        $user = $auth->authenticate($email, $password);

        if ($user) {
            echo "<p style='color: green;'>✅ Login successful!</p>";

            // Create session
            $sessionId = $auth->createSession($user['id']);
            if ($sessionId) {
                echo "<p style='color: green;'>✅ Session created</p>";

                // Set cookie with proper settings
                $cookieSet = setcookie('session', $sessionId, [
                    'expires' => time() + 7 * 24 * 60 * 60, // 7 days
                    'path' => '/',
                    'domain' => '.gtvmotor.dev',
                    'secure' => true,
                    'httponly' => true,
                    'samesite' => 'None'
                ]);

                if ($cookieSet) {
                    echo "<p style='color: green;'>✅ Cookie set successfully</p>";
                    echo "<p>Session ID: " . substr($sessionId, 0, 10) . "...</p>";
                    echo "<p>Cookie domain: .gtvmotor.dev</p>";
                    echo "<p>Cookie secure: true</p>";
                    echo "<p>Cookie samesite: None</p>";
                } else {
                    echo "<p style='color: red;'>❌ Cookie setting failed</p>";
                }
            } else {
                echo "<p style='color: red;'>❌ Session creation failed</p>";
            }
        } else {
            echo "<p style='color: red;'>❌ Login failed</p>";
        }

    } catch (Exception $e) {
        echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
    }
}

// Test 3: Test /api/auth/me after login
echo "<h3>3. Test /api/auth/me</h3>";
if (isset($_COOKIE['session'])) {
    echo "<p>Session cookie found: " . substr($_COOKIE['session'], 0, 10) . "...</p>";

    try {
        require_once __DIR__ . '/includes/Auth.php';
        $auth = new Auth();

        $user = $auth->validateSession($_COOKIE['session']);
        if ($user) {
            echo "<p style='color: green;'>✅ Session validation successful</p>";
            echo "<p>User: " . htmlspecialchars($user['email']) . "</p>";
        } else {
            echo "<p style='color: red;'>❌ Session validation failed</p>";
        }

    } catch (Exception $e) {
        echo "<p style='color: red;'>❌ Session validation error: " . $e->getMessage() . "</p>";
    }
} else {
    echo "<p>No session cookie found</p>";
}

echo "<h3>Cookie Test Complete</h3>";
echo "<p><strong>Important Notes:</strong></p>";
echo "<ul>";
echo "<li>For cross-domain cookies to work, both domains must be subdomains of the same parent domain</li>";
echo "<li>gtv-motor.vercel.app and api.gtvmotor.dev are different domains, so cookies won't work</li>";
echo "<li>Consider using Authorization headers instead of cookies for cross-domain authentication</li>";
echo "</ul>";
?>
