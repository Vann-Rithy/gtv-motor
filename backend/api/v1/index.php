<?php
/**
 * API v1 Router
 * GTV Motor PHP Backend - Main Entry Point
 * Endpoint: api.gtvmotor.dev/v1/
 */

// Enable error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users
ini_set('log_errors', 1);

// Set CORS headers FIRST - before any other output
$allowed_origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'https://gtvmotor.dev',
    'https://www.gtvmotor.dev',
    'https://app.gtvmotor.dev',
    'https://api.gtvmotor.dev'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // For development, allow localhost
    if (strpos($origin, 'localhost') !== false || strpos($origin, '127.0.0.1') !== false) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header('Access-Control-Allow-Origin: https://app.gtvmotor.dev');
    }
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
// Include both X-API-Key and x-api-key to handle case variations
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, x-api-key, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // 24 hours

// Handle preflight OPTIONS requests immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check if required files exist
// From /api/v1/, go up TWO levels to reach root, then into config/
$configPath = __DIR__ . '/../../config/config.php';
$responsePath = __DIR__ . '/../../includes/Response.php';
$v1ConfigPath = __DIR__ . '/config.php';

if (!file_exists($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Configuration file not found: ' . $configPath
    ]);
    exit;
}

if (!file_exists($responsePath)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Response class not found: ' . $responsePath
    ]);
    exit;
}

if (!file_exists($v1ConfigPath)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'API v1 config file not found: ' . $v1ConfigPath
    ]);
    exit;
}

try {
    require_once $configPath;
    require_once $responsePath;
    require_once $v1ConfigPath;
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Error loading required files: ' . $e->getMessage()
    ]);
    exit;
}

// Get request path
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Remove base path if needed (handle both /v1 and /api/v1)
$basePath = '/api/v1';
if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
} else {
    $basePath = '/v1';
    if (strpos($path, $basePath) === 0) {
        $path = substr($path, strlen($basePath));
    }
}

// Remove leading/trailing slashes
$path = trim($path, '/');

// Split path into segments
$segments = explode('/', $path);
$segments = array_filter($segments);
$segments = array_values($segments);

// Route to appropriate endpoint
$endpoint = $segments[0] ?? '';

// API Information endpoint - Redirect to documentation instead of showing JSON
if (empty($endpoint) || $endpoint === 'index.php') {
    // Redirect to documentation
    header('Location: /api/v1/docs/');
    http_response_code(301);
    exit;
}

// Route to endpoint files
// Handle endpoints with hyphens (e.g., api-keys, test-api-key)
$endpointFile = __DIR__ . '/' . $endpoint . '.php';

if (file_exists($endpointFile)) {
    require_once $endpointFile;
} else {
    Response::notFound('Endpoint not found. Available endpoints: customers, vehicles, invoices, analytics, api-keys, test-api-key');
}

?>

