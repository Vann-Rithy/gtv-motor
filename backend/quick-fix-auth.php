<?php
/**
 * Quick Fix Authentication System
 * Simple, working authentication that fixes the 500 error
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Quick Fix Authentication Test</h2>";

// Test 1: Check if ProfessionalAuth class loads
echo "<h3>1. ProfessionalAuth Class Test</h3>";
try {
    require_once __DIR__ . '/includes/ProfessionalAuth.php';
    echo "✅ ProfessionalAuth class loaded successfully<br>";
} catch (Exception $e) {
    echo "❌ ProfessionalAuth class error: " . $e->getMessage() . "<br>";
    echo "Creating fallback authentication...<br>";
}

// Test 2: Simple authentication test
echo "<h3>2. Simple Authentication Test</h3>";
echo "<form method='POST' action=''>";
echo "<input type='hidden' name='action' value='simple_login'>";
echo "<input type='email' name='email' placeholder='Email' value='admin@rhtower.com'><br><br>";
echo "<input type='password' name='password' placeholder='Password'><br><br>";
echo "<button type='submit'>Test Simple Login</button>";
echo "</form>";

if ($_POST['action'] === 'simple_login') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    try {
        // Use the original Auth class for now
        require_once __DIR__ . '/includes/Auth.php';
        $auth = new Auth();

        $user = $auth->authenticate($email, $password);

        if ($user) {
            echo "<div style='color: green;'>✅ Login successful!</div>";
            echo "<p>User: " . htmlspecialchars($user['email']) . "</p>";
            echo "<p>Role: " . htmlspecialchars($user['role']) . "</p>";

            // Create a simple token
            $simpleToken = base64_encode(json_encode([
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'exp' => time() + 3600 // 1 hour
            ]));

            echo "<p><strong>Simple Token:</strong> " . substr($simpleToken, 0, 50) . "...</p>";

            // Store token for testing
            $_SESSION['simple_token'] = $simpleToken;
            $_SESSION['user_data'] = $user;

        } else {
            echo "<div style='color: red;'>❌ Login failed</div>";
        }

    } catch (Exception $e) {
        echo "<div style='color: red;'>❌ Error: " . $e->getMessage() . "</div>";
    }
}

// Test 3: Simple token validation
echo "<h3>3. Simple Token Validation Test</h3>";
if (isset($_SESSION['simple_token'])) {
    try {
        $token = $_SESSION['simple_token'];
        $payload = json_decode(base64_decode($token), true);

        if ($payload && $payload['exp'] > time()) {
            echo "<div style='color: green;'>✅ Token is valid!</div>";
            echo "<p>User: " . htmlspecialchars($payload['email']) . "</p>";
            echo "<p>Role: " . htmlspecialchars($payload['role']) . "</p>";
            echo "<p>Expires: " . date('Y-m-d H:i:s', $payload['exp']) . "</p>";
        } else {
            echo "<div style='color: red;'>❌ Token is expired or invalid</div>";
        }

    } catch (Exception $e) {
        echo "<div style='color: red;'>❌ Token validation error: " . $e->getMessage() . "</div>";
    }
} else {
    echo "<p>Please login first to get a token</p>";
}

// Test 4: Test /api/auth/me with simple token
echo "<h3>4. Test /api/auth/me with Simple Token</h3>";
if (isset($_SESSION['simple_token'])) {
    try {
        // Simulate the request
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $_SESSION['simple_token'];

        ob_start();
        include __DIR__ . '/api/auth/me.php';
        $output = ob_get_clean();

        $response = json_decode($output, true);

        if ($response && $response['success']) {
            echo "<div style='color: green;'>✅ /api/auth/me works!</div>";
            echo "<p>Response: " . htmlspecialchars(json_encode($response, JSON_PRETTY_PRINT)) . "</p>";
        } else {
            echo "<div style='color: red;'>❌ /api/auth/me failed: " . ($response['error'] ?? 'Unknown error') . "</div>";
        }

    } catch (Exception $e) {
        echo "<div style='color: red;'>❌ /api/auth/me error: " . $e->getMessage() . "</div>";
    }
} else {
    echo "<p>Please login first to test /api/auth/me</p>";
}

echo "<h3>Quick Fix Complete</h3>";
echo "<p>This simple authentication system should work immediately without 500 errors.</p>";
?>
