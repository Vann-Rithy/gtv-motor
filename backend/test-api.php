<?php
/**
 * Simple API Test Script
 * Test the PHP backend endpoints locally
 */

// Test configuration
$baseUrl = 'http://localhost/backend';
$testEmail = 'admin@rhtower.com';
$testPassword = 'test123';

echo "🧪 GTV Motor PHP Backend Test\n";
echo "=============================\n\n";

// Test 1: Health Check
echo "1. Testing Health Check...\n";
$healthUrl = $baseUrl . '/api/health.php';

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 10,
        'ignore_errors' => true
    ]
]);

$healthResponse = @file_get_contents($healthUrl, false, $context);
if ($healthResponse === false) {
    echo "   ❌ Health check failed - Could not connect to $healthUrl\n";
    echo "   Make sure the backend server is running\n";
} else {
    $healthData = json_decode($healthResponse, true);

    if ($healthData && isset($healthData['success'])) {
        echo "   ✅ Health check passed\n";
        echo "   Database connection: " . ($healthData['data']['database']['connection'] ? 'OK' : 'FAILED') . "\n";
    } else {
        echo "   ❌ Health check failed\n";
        echo "   Response: " . $healthResponse . "\n";
    }
}

echo "\n";

// Test 2: Login
echo "2. Testing Login...\n";
$loginUrl = $baseUrl . '/api/auth/login.php';
$loginData = json_encode([
    'email' => $testEmail,
    'password' => $testPassword
]);

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => $loginData,
        'timeout' => 10,
        'ignore_errors' => true
    ]
]);

$loginResponse = @file_get_contents($loginUrl, false, $context);
if ($loginResponse === false) {
    echo "   ❌ Login failed - Could not connect to $loginUrl\n";
} else {
    $loginResult = json_decode($loginResponse, true);

    if ($loginResult && isset($loginResult['success']) && $loginResult['success']) {
        echo "   ✅ Login successful\n";
        echo "   User: " . ($loginResult['data']['user']['full_name'] ?? $loginResult['data']['user']['email']) . "\n";
        $token = $loginResult['data']['access_token'] ?? $loginResult['data']['token'] ?? 'N/A';
        echo "   Token: " . substr($token, 0, 20) . "...\n";
    } else {
        echo "   ❌ Login failed\n";
        echo "   Response: " . $loginResponse . "\n";
    }
}

echo "\n";

// Test 3: Service Types
echo "3. Testing Service Types...\n";
$serviceTypesUrl = $baseUrl . '/api/service-types.php';

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 10,
        'ignore_errors' => true
    ]
]);

$serviceTypesResponse = @file_get_contents($serviceTypesUrl, false, $context);
if ($serviceTypesResponse === false) {
    echo "   ❌ Service types failed - Could not connect to $serviceTypesUrl\n";
} else {
    $serviceTypesData = json_decode($serviceTypesResponse, true);

    if ($serviceTypesData && isset($serviceTypesData['success'])) {
        echo "   ✅ Service types retrieved\n";
        echo "   Count: " . count($serviceTypesData['data']) . " types\n";
    } else {
        echo "   ❌ Service types failed\n";
        echo "   Response: " . $serviceTypesResponse . "\n";
    }
}

echo "\n";

// Test 4: Dashboard Stats
echo "4. Testing Dashboard Stats...\n";
$statsUrl = $baseUrl . '/api/dashboard/stats.php';

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 10,
        'ignore_errors' => true
    ]
]);

$statsResponse = @file_get_contents($statsUrl, false, $context);
if ($statsResponse === false) {
    echo "   ❌ Dashboard stats failed - Could not connect to $statsUrl\n";
} else {
    $statsData = json_decode($statsResponse, true);

    if ($statsData && isset($statsData['success'])) {
        echo "   ✅ Dashboard stats retrieved\n";
        echo "   Total customers: " . ($statsData['data']['total_customers'] ?? 'N/A') . "\n";
        echo "   Total services: " . ($statsData['data']['total_services'] ?? 'N/A') . "\n";
    } else {
        echo "   ❌ Dashboard stats failed\n";
        echo "   Response: " . $statsResponse . "\n";
    }
}

echo "\n";

// Test 5: Customers
echo "5. Testing Customers...\n";
$customersUrl = $baseUrl . '/api/customers.php';

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 10,
        'ignore_errors' => true
    ]
]);

$customersResponse = @file_get_contents($customersUrl, false, $context);
if ($customersResponse === false) {
    echo "   ❌ Customers failed - Could not connect to $customersUrl\n";
} else {
    $customersData = json_decode($customersResponse, true);

    if ($customersData && isset($customersData['success'])) {
        echo "   ✅ Customers retrieved\n";
        echo "   Count: " . ($customersData['pagination']['total'] ?? count($customersData['data'])) . " customers\n";
    } else {
        echo "   ❌ Customers failed\n";
        echo "   Response: " . $customersResponse . "\n";
    }
}

echo "\n";
echo "🎉 API Testing Complete!\n";
echo "\n";
echo "If all tests passed, your PHP backend is working correctly.\n";
echo "You can now start the frontend with: npm run dev\n";
echo "\n";
echo "Frontend URL: http://localhost:3000\n";
echo "Backend API: http://localhost/backend\n";
?>
