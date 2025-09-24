<?php
/**
 * Simple Session Authentication
 * Alternative approach using session IDs in localStorage
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Simple Session Authentication Test</h2>";

// Test 1: Create a simple login endpoint that returns session ID
echo "<h3>1. Simple Login Test</h3>";
echo "<form method='POST' action=''>";
echo "<input type='hidden' name='action' value='simple_login'>";
echo "<input type='email' name='email' placeholder='Email' value='admin@rhtower.com'><br><br>";
echo "<input type='password' name='password' placeholder='Password'><br><br>";
echo "<button type='submit'>Simple Login</button>";
echo "</form>";

if ($_POST['action'] === 'simple_login') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    try {
        require_once __DIR__ . '/includes/Auth.php';
        $auth = new Auth();

        $user = $auth->authenticate($email, $password);

        if ($user) {
            $sessionId = $auth->createSession($user['id']);

            if ($sessionId) {
                echo "<p style='color: green;'>✅ Login successful!</p>";
                echo "<p>User: " . htmlspecialchars($user['email']) . "</p>";
                echo "<p><strong>Session ID:</strong> " . htmlspecialchars($sessionId) . "</p>";
                echo "<p><strong>Copy this session ID and use it in your frontend</strong></p>";

                // Test the session
                echo "<h3>2. Test Session Validation</h3>";
                $validatedUser = $auth->validateSession($sessionId);
                if ($validatedUser) {
                    echo "<p style='color: green;'>✅ Session validation successful</p>";
                    echo "<p>Validated user: " . htmlspecialchars($validatedUser['email']) . "</p>";
                } else {
                    echo "<p style='color: red;'>❌ Session validation failed</p>";
                }
            } else {
                echo "<p style='color: red;'>❌ Session creation failed</p>";
            }
        } else {
            echo "<p style='color: red;'>❌ Login failed - invalid credentials</p>";
        }

    } catch (Exception $e) {
        echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
    }
}

// Test 3: Test /api/auth/me with session ID
echo "<h3>3. Test /api/auth/me with Session ID</h3>";
echo "<form method='POST' action=''>";
echo "<input type='hidden' name='action' value='test_me'>";
echo "<input type='text' name='session_id' placeholder='Enter Session ID'><br><br>";
echo "<button type='submit'>Test /api/auth/me</button>";
echo "</form>";

if ($_POST['action'] === 'test_me') {
    $sessionId = $_POST['session_id'];

    if ($sessionId) {
        try {
            require_once __DIR__ . '/includes/Auth.php';
            $auth = new Auth();

            $user = $auth->validateSession($sessionId);
            if ($user) {
                echo "<p style='color: green;'>✅ Session is valid!</p>";
                echo "<p>User: " . htmlspecialchars($user['email']) . "</p>";
                echo "<p>Role: " . htmlspecialchars($user['role']) . "</p>";

                // Simulate the /api/auth/me response
                $response = [
                    'success' => true,
                    'data' => $user,
                    'message' => 'User data retrieved successfully'
                ];
                echo "<p><strong>API Response:</strong></p>";
                echo "<pre>" . htmlspecialchars(json_encode($response, JSON_PRETTY_PRINT)) . "</pre>";
            } else {
                echo "<p style='color: red;'>❌ Session is invalid</p>";
            }

        } catch (Exception $e) {
            echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
        }
    } else {
        echo "<p>Please enter a session ID</p>";
    }
}

echo "<h3>Instructions for Frontend</h3>";
echo "<ol>";
echo "<li>Login using the form above</li>";
echo "<li>Copy the session ID</li>";
echo "<li>In your frontend, store this session ID in localStorage</li>";
echo "<li>Send it as a query parameter: <code>?session_id=YOUR_SESSION_ID</code></li>";
echo "<li>Or send it in a custom header: <code>X-Session-ID: YOUR_SESSION_ID</code></li>";
echo "</ol>";
?>
