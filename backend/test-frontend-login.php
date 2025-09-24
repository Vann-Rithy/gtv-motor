<?php
/**
 * Frontend Login Test
 * Test login as if called from frontend
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Frontend Login Test</h2>";

// Test 1: Check if we have a test user
echo "<h3>1. Check Test User</h3>";
try {
    require_once __DIR__ . '/config/database.php';
    $database = new Database();
    $conn = $database->getConnection();

    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute(['gtv@gmail.com']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo "✅ Test user exists<br>";
    } else {
        echo "❌ No test user found<br>";
        echo "ℹ️ Please register a user first at: <a href='https://gtv-motor.vercel.app/register'>https://gtv-motor.vercel.app/register</a><br>";
        echo "<h3>Or create a test user:</h3>";
        echo "<form method='POST' action=''>";
        echo "<input type='hidden' name='action' value='create_user'>";
        echo "<input type='text' name='username' placeholder='Username' required><br><br>";
        echo "<input type='email' name='email' placeholder='Email' required><br><br>";
        echo "<input type='password' name='password' placeholder='Password' required><br><br>";
        echo "<input type='text' name='full_name' placeholder='Full Name' required><br><br>";
        echo "<button type='submit'>Create Test User</button>";
        echo "</form>";

        // Handle user creation
        if ($_POST['action'] === 'create_user') {
            $username = $_POST['username'];
            $email = $_POST['email'];
            $password = $_POST['password'];
            $fullName = $_POST['full_name'];

            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("
                INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at)
                VALUES (?, ?, ?, ?, 'admin', 1, NOW())
            ");

            if ($stmt->execute([$username, $email, $hashedPassword, $fullName])) {
                echo "<p style='color: green;'>✅ User created successfully!</p>";
                echo "<p>You can now test login with:</p>";
                echo "<p>Email: " . htmlspecialchars($email) . "</p>";
                echo "<p>Password: " . htmlspecialchars($password) . "</p>";
            } else {
                echo "<p style='color: red;'>❌ Failed to create user</p>";
            }
        }
    }

} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "<br>";
}

// Test 2: Manual login test
echo "<h3>2. Manual Login Test</h3>";
echo "<form method='POST' action=''>";
echo "<input type='hidden' name='action' value='test_login'>";
echo "<input type='email' name='email' placeholder='Email' value='gtv@gmail.com'><br><br>";
echo "<input type='password' name='password' placeholder='Password'><br><br>";
echo "<button type='submit'>Test Login</button>";
echo "</form>";

// Handle login test
if ($_POST['action'] === 'test_login') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    echo "<h3>Login Test Results:</h3>";

    try {
        require_once __DIR__ . '/includes/Auth.php';
        $auth = new Auth();

        $user = $auth->authenticate($email, $password);

        if ($user) {
            echo "<p style='color: green;'>✅ Login successful!</p>";
            echo "<p>User: " . htmlspecialchars($user['email']) . "</p>";
            echo "<p>Role: " . htmlspecialchars($user['role']) . "</p>";

            // Test session creation
            $sessionId = $auth->createSession($user['id']);
            if ($sessionId) {
                echo "<p style='color: green;'>✅ Session created successfully</p>";
                echo "<p>Session ID: " . substr($sessionId, 0, 10) . "...</p>";
            } else {
                echo "<p style='color: red;'>❌ Session creation failed</p>";
            }
        } else {
            echo "<p style='color: red;'>❌ Login failed - invalid credentials</p>";
        }

    } catch (Exception $e) {
        echo "<p style='color: red;'>❌ Login error: " . $e->getMessage() . "</p>";
    }
}

echo "<h3>Test Complete</h3>";
echo "<p><strong>Next Steps:</strong></p>";
echo "<ol>";
echo "<li>If no test user exists, create one using the form above</li>";
echo "<li>Test login with the credentials</li>";
echo "<li>If login works here, try logging in from your frontend</li>";
echo "</ol>";
?>
