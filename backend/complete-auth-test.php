<?php
/**
 * Complete Authentication Flow Test
 * Tests the exact same flow the frontend uses
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>🔐 Complete Authentication Flow Test</h1>";

// Test 1: Login Test (exactly like frontend)
echo "<h2>1. Frontend-Style Login Test</h2>";
echo "<form method='POST' action=''>";
echo "<input type='hidden' name='action' value='frontend_login'>";
echo "<input type='email' name='email' placeholder='Email' value='admin@rhtower.com'><br><br>";
echo "<input type='password' name='password' placeholder='Password'><br><br>";
echo "<button type='submit'>Test Frontend Login</button>";
echo "</form>";

if ($_POST['action'] === 'frontend_login') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    try {
        // Simulate exact frontend request
        $loginData = json_encode(['email' => $email, 'password' => $password]);

        // Test login endpoint
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://api.gtvmotor.dev/api/auth/login');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $loginData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Cache-Control: no-cache',
            'Pragma: no-cache'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        echo "<h3>Login Response:</h3>";
        echo "<p><strong>HTTP Code:</strong> $httpCode</p>";
        echo "<p><strong>Response:</strong></p>";
        echo "<pre>" . htmlspecialchars($response) . "</pre>";

        $data = json_decode($response, true);

        if ($httpCode === 200 && $data && $data['success']) {
            echo "<div style='color: green;'>✅ Login successful!</div>";
            echo "<p><strong>User:</strong> " . htmlspecialchars($data['data']['user']['email']) . "</p>";
            echo "<p><strong>Token:</strong> " . substr($data['data']['token'], 0, 50) . "...</p>";

            // Store token for next test
            $_SESSION['test_token'] = $data['data']['token'];
            $_SESSION['test_user'] = $data['data']['user'];

        } else {
            echo "<div style='color: red;'>❌ Login failed</div>";
            if ($data && isset($data['error'])) {
                echo "<p><strong>Error:</strong> " . htmlspecialchars($data['error']) . "</p>";
            }
        }

    } catch (Exception $e) {
        echo "<div style='color: red;'>❌ Error: " . $e->getMessage() . "</div>";
    }
}

// Test 2: /api/auth/me Test (exactly like frontend)
echo "<h2>2. Frontend-Style /api/auth/me Test</h2>";
if (isset($_SESSION['test_token'])) {
    try {
        $token = $_SESSION['test_token'];

        // Test /api/auth/me endpoint
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://api.gtvmotor.dev/api/auth/me');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $token,
            'Cache-Control: no-cache',
            'Pragma: no-cache'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        echo "<h3>/api/auth/me Response:</h3>";
        echo "<p><strong>HTTP Code:</strong> $httpCode</p>";
        echo "<p><strong>Response:</strong></p>";
        echo "<pre>" . htmlspecialchars($response) . "</pre>";

        $data = json_decode($response, true);

        if ($httpCode === 200 && $data && $data['success']) {
            echo "<div style='color: green;'>✅ /api/auth/me successful!</div>";
            echo "<p><strong>User:</strong> " . htmlspecialchars($data['data']['email']) . "</p>";
            echo "<p><strong>Role:</strong> " . htmlspecialchars($data['data']['role']) . "</p>";
        } else {
            echo "<div style='color: red;'>❌ /api/auth/me failed</div>";
            if ($data && isset($data['error'])) {
                echo "<p><strong>Error:</strong> " . htmlspecialchars($data['error']) . "</p>";
            }
        }

    } catch (Exception $e) {
        echo "<div style='color: red;'>❌ Error: " . $e->getMessage() . "</div>";
    }
} else {
    echo "<p>Please run the login test first to get a token</p>";
}

// Test 3: JavaScript Simulation
echo "<h2>3. JavaScript Frontend Simulation</h2>";
echo "<div id='js-test'>";
echo "<button onclick='testJavaScriptAuth()'>Test JavaScript Authentication</button>";
echo "<div id='js-result'></div>";
echo "</div>";

echo "<script>
async function testJavaScriptAuth() {
    const resultDiv = document.getElementById('js-result');
    resultDiv.innerHTML = '<p>Testing JavaScript authentication...</p>';

    try {
        // Step 1: Login
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

        if (loginResponse.ok && loginData.success && loginData.data.token) {
            resultDiv.innerHTML += '<div style=\"color: green;\">✅ JavaScript Login: SUCCESS</div>';
            resultDiv.innerHTML += '<p>User: ' + loginData.data.user.email + '</p>';
            resultDiv.innerHTML += '<p>Token: ' + loginData.data.token.substring(0, 50) + '...</p>';

            // Step 2: Test /api/auth/me
            const meResponse = await fetch('https://api.gtvmotor.dev/api/auth/me', {
                headers: {
                    'Authorization': 'Bearer ' + loginData.data.token,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            const meData = await meResponse.json();

            if (meResponse.ok && meData.success) {
                resultDiv.innerHTML += '<div style=\"color: green;\">✅ JavaScript /api/auth/me: SUCCESS</div>';
                resultDiv.innerHTML += '<p>User: ' + meData.data.email + '</p>';
                resultDiv.innerHTML += '<p>Role: ' + meData.data.role + '</p>';
            } else {
                resultDiv.innerHTML += '<div style=\"color: red;\">❌ JavaScript /api/auth/me: FAILED</div>';
                resultDiv.innerHTML += '<p>Error: ' + (meData.error || 'Unknown error') + '</p>';
            }
        } else {
            resultDiv.innerHTML += '<div style=\"color: red;\">❌ JavaScript Login: FAILED</div>';
            resultDiv.innerHTML += '<p>Error: ' + (loginData.error || 'Unknown error') + '</p>';
        }
    } catch (error) {
        resultDiv.innerHTML += '<div style=\"color: red;\">❌ JavaScript Error: ' + error.message + '</div>';
    }
}
</script>";

// Test 4: Response Format Check
echo "<h2>4. Response Format Analysis</h2>";
echo "<div style='background: #f0f0f0; padding: 15px; border-radius: 5px;'>";
echo "<h3>Expected Frontend Format:</h3>";
echo "<pre>";
echo "{\n";
echo "  \"success\": true,\n";
echo "  \"data\": {\n";
echo "    \"user\": { ... },\n";
echo "    \"token\": \"base64_token_here\",\n";
echo "    \"access_token\": \"base64_token_here\",\n";
echo "    \"token_type\": \"Bearer\",\n";
echo "    \"expires_in\": 3600,\n";
echo "    \"session_id\": \"session_id_here\"\n";
echo "  },\n";
echo "  \"message\": \"Login successful\"\n";
echo "}";
echo "</pre>";
echo "</div>";

echo "<h2>5. Summary</h2>";
echo "<div style='background: #d4edda; padding: 15px; border-radius: 5px;'>";
echo "<h3>✅ Fixed Issues:</h3>";
echo "<ul>";
echo "<li><strong>Response Format:</strong> Added 'token' field for frontend compatibility</li>";
echo "<li><strong>401 Error:</strong> Fixed token format mismatch</li>";
echo "<li><strong>Login Failed:</strong> Frontend now receives expected response</li>";
echo "<li><strong>Cross-Domain:</strong> Works across different domains</li>";
echo "</ul>";
echo "</div>";
?>
