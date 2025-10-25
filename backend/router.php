<?php
/**
 * Simple Router for PHP Development Server
 * Routes API requests to the appropriate PHP files
 */

// Get the request URI
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove query string
$path = parse_url($requestUri, PHP_URL_PATH);

// Debug logging
error_log("Router: Request URI: $requestUri, Path: $path, Method: $requestMethod");

// Route API requests
if (strpos($path, '/api/') === 0) {
    // Remove /api prefix
    $apiPath = substr($path, 4);
    error_log("Router: API Path: $apiPath");
    
    // Route to appropriate API file
    if ($apiPath === 'warranties') {
        if ($requestMethod === 'GET') {
            include __DIR__ . '/api/warranties.php';
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
    } elseif (preg_match('/^warranties\/(\d+)$/', $apiPath, $matches)) {
        if ($requestMethod === 'GET') {
            $_GET['id'] = $matches[1];
            include __DIR__ . '/api/warranties.php';
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
    } elseif ($apiPath === 'health') {
        include __DIR__ . '/api/health.php';
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'API endpoint not found', 'path' => $apiPath]);
    }
} else {
    // Serve static files or show API info
    if ($path === '/' || $path === '') {
        header('Content-Type: application/json');
        echo json_encode([
            'message' => 'GTV Motor API Server',
            'version' => '1.0.0',
            'endpoints' => [
                'GET /api/warranties' => 'List warranties',
                'GET /api/warranties/{id}' => 'Get warranty by ID',
                'GET /api/health' => 'Health check'
            ]
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Not found', 'path' => $path]);
    }
}
?>
