<?php
/**
 * GTV Motor - Command Line API Test
 * Comprehensive test of all API endpoints from command line
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Colors for output
class Colors {
    const RED = "\033[31m";
    const GREEN = "\033[32m";
    const YELLOW = "\033[33m";
    const BLUE = "\033[34m";
    const MAGENTA = "\033[35m";
    const CYAN = "\033[36m";
    const WHITE = "\033[37m";
    const RESET = "\033[0m";
    const BOLD = "\033[1m";
}

function printHeader($text) {
    echo Colors::BOLD . Colors::BLUE . "=== $text ===" . Colors::RESET . "\n";
}

function printSuccess($text) {
    echo Colors::GREEN . "✅ $text" . Colors::RESET . "\n";
}

function printError($text) {
    echo Colors::RED . "❌ $text" . Colors::RESET . "\n";
}

function printWarning($text) {
    echo Colors::YELLOW . "⚠️  $text" . Colors::RESET . "\n";
}

function printInfo($text) {
    echo Colors::CYAN . "ℹ️  $text" . Colors::RESET . "\n";
}

// Test configuration
$API_BASE_URL = 'https://api.gtvmotor.dev';
$LOGIN_CREDENTIALS = [
    'email' => 'ahpea88@gmail.com',
    'password' => '123456'
];

$authToken = null;
$testResults = [];

// Test endpoints configuration
$testEndpoints = [
    'authentication' => [
        'name' => 'Authentication System',
        'tests' => [
            ['name' => 'Login', 'endpoint' => '/api/auth/login', 'method' => 'POST', 'requiresAuth' => false],
            ['name' => 'Get Current User', 'endpoint' => '/api/auth/me', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Logout', 'endpoint' => '/api/auth/logout', 'method' => 'POST', 'requiresAuth' => true]
        ]
    ],
    'dashboard' => [
        'name' => 'Dashboard Features',
        'tests' => [
            ['name' => 'Dashboard Stats', 'endpoint' => '/api/dashboard/stats', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Dashboard Analytics', 'endpoint' => '/api/dashboard/analytics', 'method' => 'GET', 'requiresAuth' => true]
        ]
    ],
    'customers' => [
        'name' => 'Customer Management',
        'tests' => [
            ['name' => 'Customer List', 'endpoint' => '/api/customers', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Customer Details (ID: 1)', 'endpoint' => '/api/customers/1', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Customer Details (ID: 2)', 'endpoint' => '/api/customers/2', 'method' => 'GET', 'requiresAuth' => true]
        ]
    ],
    'services' => [
        'name' => 'Service Management',
        'tests' => [
            ['name' => 'Service List', 'endpoint' => '/api/services', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Service Details (ID: 1)', 'endpoint' => '/api/services/1', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Service Details (ID: 2)', 'endpoint' => '/api/services/2', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Service Types', 'endpoint' => '/api/service-types', 'method' => 'GET', 'requiresAuth' => true]
        ]
    ],
    'vehicles' => [
        'name' => 'Vehicle Management',
        'tests' => [
            ['name' => 'Vehicle List', 'endpoint' => '/api/vehicles', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Vehicle Details (ID: 1)', 'endpoint' => '/api/vehicles/1', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Vehicle Details (ID: 2)', 'endpoint' => '/api/vehicles/2', 'method' => 'GET', 'requiresAuth' => true]
        ]
    ],
    'inventory' => [
        'name' => 'Inventory Management',
        'tests' => [
            ['name' => 'Inventory List', 'endpoint' => '/api/inventory', 'method' => 'GET', 'requiresAuth' => true]
        ]
    ],
    'bookings' => [
        'name' => 'Booking Management',
        'tests' => [
            ['name' => 'Booking List', 'endpoint' => '/api/bookings', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Booking Details (ID: 1)', 'endpoint' => '/api/bookings/1', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Booking Details (ID: 2)', 'endpoint' => '/api/bookings/2', 'method' => 'GET', 'requiresAuth' => true]
        ]
    ],
    'warranties' => [
        'name' => 'Warranty Management',
        'tests' => [
            ['name' => 'Warranty List', 'endpoint' => '/api/warranties', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Warranty Details (ID: 1)', 'endpoint' => '/api/warranties/1', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Warranty Details (ID: 2)', 'endpoint' => '/api/warranties/2', 'method' => 'GET', 'requiresAuth' => true]
        ]
    ],
    'alerts' => [
        'name' => 'Alert Management',
        'tests' => [
            ['name' => 'Alert List', 'endpoint' => '/api/alerts', 'method' => 'GET', 'requiresAuth' => true]
        ]
    ],
    'reports' => [
        'name' => 'Report System',
        'tests' => [
            ['name' => 'Summary Report', 'endpoint' => '/api/reports/summary', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Customer Report', 'endpoint' => '/api/reports/customer', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Warranty Report', 'endpoint' => '/api/reports/warranty', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Inventory Report', 'endpoint' => '/api/reports/inventory', 'method' => 'GET', 'requiresAuth' => true]
        ]
    ],
    'analytics' => [
        'name' => 'Analytics System',
        'tests' => [
            ['name' => 'Analytics Data', 'endpoint' => '/api/analytics', 'method' => 'GET', 'requiresAuth' => true]
        ]
    ],
    'settings' => [
        'name' => 'Settings Management',
        'tests' => [
            ['name' => 'Settings List', 'endpoint' => '/api/settings', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Company Settings', 'endpoint' => '/api/settings/company', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'System Settings', 'endpoint' => '/api/settings/system', 'method' => 'GET', 'requiresAuth' => true],
            ['name' => 'Notification Settings', 'endpoint' => '/api/settings/notifications', 'method' => 'GET', 'requiresAuth' => true]
        ]
    ],
    'staff' => [
        'name' => 'Staff Management',
        'tests' => [
            ['name' => 'Staff List', 'endpoint' => '/api/staff', 'method' => 'GET', 'requiresAuth' => true]
        ]
    ],
    'notifications' => [
        'name' => 'Notification System',
        'tests' => [
            ['name' => 'Notification List', 'endpoint' => '/api/notifications', 'method' => 'GET', 'requiresAuth' => true]
        ]
    ]
];

function makeRequest($url, $method = 'GET', $data = null, $headers = []) {
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }

    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);

    curl_close($ch);

    if ($error) {
        throw new Exception("cURL Error: $error");
    }

    return [
        'body' => $response,
        'http_code' => $httpCode
    ];
}

function testEndpoint($test) {
    global $API_BASE_URL, $authToken;

    $url = $API_BASE_URL . $test['endpoint'];
    $headers = ['Content-Type: application/json'];

    if ($test['requiresAuth'] && $authToken) {
        $url .= '?token=' . $authToken;
    }

    try {
        $data = null;
        if ($test['method'] === 'POST' && $test['endpoint'] === '/api/auth/login') {
            global $LOGIN_CREDENTIALS;
            $data = $LOGIN_CREDENTIALS;
        }

        $response = makeRequest($url, $test['method'], $data, $headers);

        if ($response['http_code'] === 200) {
            if (empty($response['body'])) {
                return ['success' => false, 'message' => 'Empty response body'];
            }

            $json = json_decode($response['body'], true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return ['success' => false, 'message' => 'Invalid JSON: ' . json_last_error_msg()];
            }

            if (isset($json['success']) && $json['success']) {
                $dataCount = 0;
                if (isset($json['data'])) {
                    if (is_array($json['data'])) {
                        $dataCount = count($json['data']);
                    } else {
                        $dataCount = 1;
                    }
                }
                return ['success' => true, 'message' => "Success - $dataCount items, " . strlen($response['body']) . " chars"];
            } else {
                return ['success' => false, 'message' => 'API Error: ' . ($json['error'] ?? 'Unknown error')];
            }
        } else {
            return ['success' => false, 'message' => "HTTP {$response['http_code']}: " . substr($response['body'], 0, 100)];
        }
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Request failed: ' . $e->getMessage()];
    }
}

function login() {
    global $API_BASE_URL, $LOGIN_CREDENTIALS, $authToken;

    printInfo("Attempting to login...");

    try {
        $response = makeRequest(
            $API_BASE_URL . '/api/auth/login',
            'POST',
            $LOGIN_CREDENTIALS,
            ['Content-Type: application/json']
        );

        if ($response['http_code'] === 200) {
            $json = json_decode($response['body'], true);
            if ($json && isset($json['success']) && $json['success'] && isset($json['data']['token'])) {
                $authToken = $json['data']['token'];
                printSuccess("Login successful - User: " . $json['data']['user']['email']);
                printInfo("Token: " . $authToken);
                return true;
            } else {
                printError("Login failed: " . ($json['error'] ?? 'Unknown error'));
                return false;
            }
        } else {
            printError("Login HTTP error: {$response['http_code']}");
            return false;
        }
    } catch (Exception $e) {
        printError("Login failed: " . $e->getMessage());
        return false;
    }
}

function runTests() {
    global $testEndpoints, $testResults;

    printHeader("GTV Motor API Command Line Test");
    printInfo("Testing API endpoints locally...");
    echo "\n";

    // Login first
    if (!login()) {
        printError("Cannot proceed without authentication");
        return;
    }

    echo "\n";

    $totalTests = 0;
    $passedTests = 0;

    foreach ($testEndpoints as $category => $categoryData) {
        printHeader($categoryData['name']);

        foreach ($categoryData['tests'] as $test) {
            $totalTests++;
            $result = testEndpoint($test);
            $testResults[$test['name']] = $result;

            if ($result['success']) {
                printSuccess("{$test['name']}: {$result['message']}");
                $passedTests++;
            } else {
                printError("{$test['name']}: {$result['message']}");
            }
        }

        echo "\n";
    }

    // Summary
    printHeader("Test Summary");
    $successRate = $totalTests > 0 ? round(($passedTests / $totalTests) * 100) : 0;

    if ($successRate === 100) {
        printSuccess("All tests passed! ($passedTests/$totalTests - $successRate%)");
    } elseif ($successRate >= 90) {
        printWarning("Most tests passed ($passedTests/$totalTests - $successRate%)");
    } else {
        printError("Many tests failed ($passedTests/$totalTests - $successRate%)");
    }

    echo "\n";
    printInfo("Test completed at " . date('Y-m-d H:i:s'));
}

// Run the tests
runTests();
?>
