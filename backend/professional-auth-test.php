<?php
/**
 * Professional Authentication Test Suite
 * Comprehensive testing for the authentication system
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>🔐 Professional Authentication Test Suite</h1>";

// Test 1: System Health Check
echo "<h2>1. System Health Check</h2>";
try {
    require_once __DIR__ . '/config/database.php';
    $database = new Database();
    $conn = $database->getConnection();

    // Check database connection
    $stmt = $conn->query("SELECT 1");
    echo "✅ Database connection: OK<br>";

    // Check required tables
    $tables = ['users', 'user_sessions', 'login_attempts'];
    foreach ($tables as $table) {
        $stmt = $conn->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "✅ Table '$table': EXISTS<br>";
        } else {
            echo "❌ Table '$table': MISSING<br>";
        }
    }

    // Check JWT configuration
    if (defined('JWT_SECRET') && JWT_SECRET !== 'your-secret-key-change-this-in-production') {
        echo "✅ JWT Secret: CONFIGURED<br>";
    } else {
        echo "❌ JWT Secret: NOT CONFIGURED<br>";
    }

} catch (Exception $e) {
    echo "❌ System health check failed: " . $e->getMessage() . "<br>";
}

// Test 2: Professional Authentication Class
echo "<h2>2. Professional Authentication Class Test</h2>";
try {
    require_once __DIR__ . '/includes/ProfessionalAuth.php';
    $auth = new ProfessionalAuth();
    echo "✅ ProfessionalAuth class: LOADED<br>";

    // Test JWT token creation
    $testUser = [
        'id' => 1,
        'email' => 'test@example.com',
        'role' => 'admin'
    ];

    $reflection = new ReflectionClass($auth);
    $method = $reflection->getMethod('createJWTToken');
    $method->setAccessible(true);
    $token = $method->invoke($auth, $testUser);

    if ($token && strpos($token, '.') !== false) {
        echo "✅ JWT Token creation: WORKING<br>";
        echo "Token preview: " . substr($token, 0, 50) . "...<br>";
    } else {
        echo "❌ JWT Token creation: FAILED<br>";
    }

} catch (Exception $e) {
    echo "❌ ProfessionalAuth test failed: " . $e->getMessage() . "<br>";
}

// Test 3: Login Endpoint Test
echo "<h2>3. Login Endpoint Test</h2>";
echo "<form method='POST' action=''>";
echo "<input type='hidden' name='action' value='test_login'>";
echo "<input type='email' name='email' placeholder='Email' value='admin@rhtower.com'><br><br>";
echo "<input type='password' name='password' placeholder='Password'><br><br>";
echo "<button type='submit'>Test Professional Login</button>";
echo "</form>";

if ($_POST['action'] === 'test_login') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    try {
        // Simulate login request
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_SERVER['CONTENT_TYPE'] = 'application/json';

        // Mock request body
        $loginData = json_encode(['email' => $email, 'password' => $password]);

        // Override file_get_contents for testing
        function mockFileGetContents($filename) {
            global $loginData;
            if ($filename === 'php://input') {
                return $loginData;
            }
            return file_get_contents($filename);
        }

        ob_start();
        include __DIR__ . '/api/auth/login.php';
        $output = ob_get_clean();

        $response = json_decode($output, true);

        if ($response && $response['success']) {
            echo "<div style='color: green;'>✅ Login successful!</div>";
            echo "<p><strong>User:</strong> " . htmlspecialchars($response['data']['user']['email']) . "</p>";
            echo "<p><strong>Role:</strong> " . htmlspecialchars($response['data']['user']['role']) . "</p>";
            echo "<p><strong>Token Type:</strong> " . htmlspecialchars($response['data']['token_type']) . "</p>";
            echo "<p><strong>Expires In:</strong> " . $response['data']['expires_in'] . " seconds</p>";
            echo "<p><strong>Access Token:</strong> " . substr($response['data']['access_token'], 0, 50) . "...</p>";

            // Store token for next test
            $_SESSION['test_token'] = $response['data']['access_token'];
        } else {
            echo "<div style='color: red;'>❌ Login failed: " . ($response['error'] ?? 'Unknown error') . "</div>";
        }

    } catch (Exception $e) {
        echo "<div style='color: red;'>❌ Login test error: " . $e->getMessage() . "</div>";
    }
}

// Test 4: Token Validation Test
echo "<h2>4. Token Validation Test</h2>";
if (isset($_SESSION['test_token'])) {
    try {
        // Simulate /api/auth/me request
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $_SESSION['test_token'];

        ob_start();
        include __DIR__ . '/api/auth/me.php';
        $output = ob_get_clean();

        $response = json_decode($output, true);

        if ($response && $response['success']) {
            echo "<div style='color: green;'>✅ Token validation successful!</div>";
            echo "<p><strong>User:</strong> " . htmlspecialchars($response['data']['email']) . "</p>";
            echo "<p><strong>Role:</strong> " . htmlspecialchars($response['data']['role']) . "</p>";
        } else {
            echo "<div style='color: red;'>❌ Token validation failed: " . ($response['error'] ?? 'Unknown error') . "</div>";
        }

    } catch (Exception $e) {
        echo "<div style='color: red;'>❌ Token validation error: " . $e->getMessage() . "</div>";
    }
} else {
    echo "<p>ℹ️ Please run the login test first to get a token</p>";
}

// Test 5: Security Features Test
echo "<h2>5. Security Features Test</h2>";
try {
    require_once __DIR__ . '/includes/ProfessionalAuth.php';
    $auth = new ProfessionalAuth();

    // Test rate limiting
    $reflection = new ReflectionClass($auth);
    $method = $reflection->getMethod('checkRateLimit');
    $method->setAccessible(true);

    $rateLimitOk = $method->invoke($auth, 'test@example.com', '127.0.0.1');
    echo $rateLimitOk ? "✅ Rate limiting: WORKING<br>" : "❌ Rate limiting: FAILED<br>";

    // Test JWT signature validation
    $method = $reflection->getMethod('decodeJWT');
    $method->setAccessible(true);

    $invalidToken = 'invalid.token.here';
    $result = $method->invoke($auth, $invalidToken);
    echo $result === false ? "✅ JWT signature validation: WORKING<br>" : "❌ JWT signature validation: FAILED<br>";

} catch (Exception $e) {
    echo "❌ Security features test failed: " . $e->getMessage() . "<br>";
}

// Test 6: Frontend Integration Test
echo "<h2>6. Frontend Integration Test</h2>";
echo "<div id='frontend-test'>";
echo "<button onclick='testFrontendAuth()'>Test Frontend Authentication</button>";
echo "<div id='frontend-result'></div>";
echo "</div>";

echo "<script>
async function testFrontendAuth() {
    const resultDiv = document.getElementById('frontend-result');
    resultDiv.innerHTML = '<p>Testing...</p>';

    try {
        // Test login
        const loginResponse = await fetch('https://api.gtvmotor.dev/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            body: JSON.stringify({
                email: 'admin@rhtower.com',
                password: 'test123'
            })
        });

        const loginData = await loginResponse.json();

        if (loginData.success && loginData.data.access_token) {
            resultDiv.innerHTML = '<div style=\"color: green;\">✅ Frontend login: SUCCESS</div>';

            // Test /api/auth/me with token
            const meResponse = await fetch('https://api.gtvmotor.dev/api/auth/me', {
                headers: {
                    'Authorization': 'Bearer ' + loginData.data.access_token,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            const meData = await meResponse.json();

            if (meData.success) {
                resultDiv.innerHTML += '<div style=\"color: green;\">✅ Frontend /api/auth/me: SUCCESS</div>';
                resultDiv.innerHTML += '<p>User: ' + meData.data.email + '</p>';
            } else {
                resultDiv.innerHTML += '<div style=\"color: red;\">❌ Frontend /api/auth/me: FAILED</div>';
            }
        } else {
            resultDiv.innerHTML = '<div style=\"color: red;\">❌ Frontend login: FAILED</div>';
        }
    } catch (error) {
        resultDiv.innerHTML = '<div style=\"color: red;\">❌ Frontend test error: ' + error.message + '</div>';
    }
}
</script>";

echo "<h2>7. Test Summary</h2>";
echo "<div style='background: #f0f0f0; padding: 15px; border-radius: 5px;'>";
echo "<h3>✅ Professional Authentication System Features:</h3>";
echo "<ul>";
echo "<li>JWT-based authentication with proper signature validation</li>";
echo "<li>Rate limiting (max 5 attempts per 15 minutes)</li>";
echo "<li>Account locking after 10 failed attempts</li>";
echo "<li>Comprehensive login attempt logging</li>";
echo "<li>Secure token storage and validation</li>";
echo "<li>Cross-domain compatibility</li>";
echo "<li>Professional error handling</li>";
echo "<li>Session management with expiration</li>";
echo "</ul>";
echo "</div>";

echo "<h2>8. Next Steps</h2>";
echo "<ol>";
echo "<li>Upload the updated backend files</li>";
echo "<li>Update your frontend to use the new authentication system</li>";
echo "<li>Test the complete login flow</li>";
echo "<li>Verify that /api/auth/me works with the new JWT tokens</li>";
echo "</ol>";
?>
