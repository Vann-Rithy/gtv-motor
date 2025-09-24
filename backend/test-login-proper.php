<?php
/**
 * Proper Login Test
 * Test login with correct request simulation
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Proper Login Test</h2>";

// Test 1: Check if test user exists
echo "<h3>1. Check Test User</h3>";
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
        echo "Password hash exists: " . (!empty($user['password_hash']) ? 'Yes' : 'No') . "<br>";
    } else {
        echo "❌ Test user not found<br>";
        echo "ℹ️ You need to register a user first<br>";

        // Try to create a test user
        echo "<h3>Creating Test User</h3>";
        $hashedPassword = password_hash('password123', PASSWORD_DEFAULT);
        $stmt = $conn->prepare("
            INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, 1, NOW())
        ");
        $result = $stmt->execute(['gtv', 'gtv@gmail.com', $hashedPassword, 'GTV Test User', 'admin']);

        if ($result) {
            echo "✅ Test user created successfully<br>";
            echo "Email: gtv@gmail.com<br>";
            echo "Password: password123<br>";
        } else {
            echo "❌ Failed to create test user<br>";
        }
    }

} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "<br>";
}

// Test 2: Test Request class
echo "<h3>2. Test Request Class</h3>";
try {
    require_once __DIR__ . '/includes/Request.php';

    // Test Request::body() method
    echo "✅ Request class loaded<br>";

    // Simulate JSON input
    $testData = ['email' => 'gtv@gmail.com', 'password' => 'password123'];
    $jsonData = json_encode($testData);

    // Override php://input for testing
    $originalInput = file_get_contents('php://input');

    echo "Test data: " . htmlspecialchars($jsonData) . "<br>";

} catch (Exception $e) {
    echo "❌ Request class error: " . $e->getMessage() . "<br>";
}

// Test 3: Test login with cURL simulation
echo "<h3>3. cURL Login Test</h3>";
try {
    $loginData = [
        'email' => 'gtv@gmail.com',
        'password' => 'password123'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.gtvmotor.dev/api/auth/login');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_COOKIEJAR, '/tmp/cookies.txt');
    curl_setopt($ch, CURLOPT_COOKIEFILE, '/tmp/cookies.txt');

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "HTTP Code: " . $httpCode . "<br>";
    echo "Response: " . htmlspecialchars($response) . "<br>";

    if ($httpCode === 200) {
        echo "✅ Login successful via cURL<br>";
    } else {
        echo "❌ Login failed via cURL<br>";
    }

} catch (Exception $e) {
    echo "❌ cURL test error: " . $e->getMessage() . "<br>";
}

echo "<h3>Login Test Complete</h3>";
?>
