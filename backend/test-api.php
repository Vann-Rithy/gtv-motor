<?php
/**
 * Simple API Test Script
 * Test the PHP backend endpoints locally
 */

// Test configuration
$baseUrl = 'http://localhost/backend';
$testEmail = 'admin@gtvmotor.com';
$testPassword = 'admin123';

echo "🧪 GTV Motor PHP Backend Test\n";
echo "=============================\n\n";

// Test 1: Health Check
echo "1. Testing Health Check...\n";
$healthUrl = $baseUrl . '/api/health';
$healthResponse = file_get_contents($healthUrl);
$healthData = json_decode($healthResponse, true);

if ($healthData && isset($healthData['success'])) {
    echo "   ✅ Health check passed\n";
    echo "   Database connection: " . ($healthData['data']['database']['connection'] ? 'OK' : 'FAILED') . "\n";
} else {
    echo "   ❌ Health check failed\n";
    echo "   Response: " . $healthResponse . "\n";
}

echo "\n";

// Test 2: Login
echo "2. Testing Login...\n";
$loginUrl = $baseUrl . '/api/auth/login';
$loginData = json_encode([
    'email' => $testEmail,
    'password' => $testPassword
]);

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => $loginData
    ]
]);

$loginResponse = file_get_contents($loginUrl, false, $context);
$loginResult = json_decode($loginResponse, true);

if ($loginResult && isset($loginResult['success']) && $loginResult['success']) {
    echo "   ✅ Login successful\n";
    echo "   User: " . $loginResult['data']['user']['full_name'] . "\n";
    $sessionId = $loginResult['data']['session_id'] ?? 'N/A';
    echo "   Session ID: " . substr($sessionId, 0, 20) . "...\n";
} else {
    echo "   ❌ Login failed\n";
    echo "   Response: " . $loginResponse . "\n";
}

echo "\n";

// Test 3: Service Types
echo "3. Testing Service Types...\n";
$serviceTypesUrl = $baseUrl . '/api/service-types';
$serviceTypesResponse = file_get_contents($serviceTypesUrl);
$serviceTypesData = json_decode($serviceTypesResponse, true);

if ($serviceTypesData && isset($serviceTypesData['success'])) {
    echo "   ✅ Service types retrieved\n";
    echo "   Count: " . count($serviceTypesData['data']) . " types\n";
} else {
    echo "   ❌ Service types failed\n";
    echo "   Response: " . $serviceTypesResponse . "\n";
}

echo "\n";

// Test 4: Dashboard Stats
echo "4. Testing Dashboard Stats...\n";
$statsUrl = $baseUrl . '/api/dashboard/stats';
$statsResponse = file_get_contents($statsUrl);
$statsData = json_decode($statsResponse, true);

if ($statsData && isset($statsData['success'])) {
    echo "   ✅ Dashboard stats retrieved\n";
    echo "   Total customers: " . ($statsData['data']['total_customers'] ?? 'N/A') . "\n";
    echo "   Total services: " . ($statsData['data']['total_services'] ?? 'N/A') . "\n";
} else {
    echo "   ❌ Dashboard stats failed\n";
    echo "   Response: " . $statsResponse . "\n";
}

echo "\n";

// Test 5: Customers
echo "5. Testing Customers...\n";
$customersUrl = $baseUrl . '/api/customers';
$customersResponse = file_get_contents($customersUrl);
$customersData = json_decode($customersResponse, true);

if ($customersData && isset($customersData['success'])) {
    echo "   ✅ Customers retrieved\n";
    echo "   Count: " . ($customersData['pagination']['total'] ?? 'N/A') . " customers\n";
} else {
    echo "   ❌ Customers failed\n";
    echo "   Response: " . $customersResponse . "\n";
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
