<?php
/**
 * GTV Motor PHP Backend API
 * Main entry point for all API requests
 */

// Load configuration
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/includes/Request.php';
require_once __DIR__ . '/includes/Response.php';

// Get request URI and method
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove query string from URI
$uri = parse_url($requestUri, PHP_URL_PATH);

// Remove base path if running in subdirectory
$basePath = '/backend';
if (strpos($uri, $basePath) === 0) {
    $uri = substr($uri, strlen($basePath));
}

// Remove leading slash
$uri = ltrim($uri, '/');

// Debug: Log the URI for troubleshooting
error_log("Request URI: " . $requestUri);
error_log("Processed URI: " . $uri);

// Split URI into segments
$segments = explode('/', $uri);

// Route the request
try {
    // Handle root access
    if (empty($uri) || $uri === 'index.php') {
        Response::success([
            'message' => 'GTV Motor PHP Backend API',
            'version' => '1.0.0',
            'endpoints' => [
                'health' => '/api/health',
                'auth' => '/api/auth/login',
                'customers' => '/api/customers',
                'vehicles' => '/api/vehicles',
                'services' => '/api/services',
                'dashboard' => '/api/dashboard/stats'
            ]
        ], 'API is running');
    }
    
    // Health check endpoint
    if ($uri === 'health' && $requestMethod === 'GET') {
        require_once __DIR__ . '/api/health.php';
        exit;
    }
    
    // API endpoints
    if (strpos($uri, 'api/') === 0) {
        $apiPath = substr($uri, 4); // Remove 'api/' prefix
        
        // Route to appropriate API file
        switch ($apiPath) {
            case 'auth/login':
                if ($requestMethod === 'POST') {
                    require_once __DIR__ . '/api/auth/login.php';
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;
                
            case 'auth/logout':
                if ($requestMethod === 'POST') {
                    require_once __DIR__ . '/api/auth/logout.php';
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;
                
            case 'auth/register':
                if ($requestMethod === 'POST') {
                    require_once __DIR__ . '/api/auth/register.php';
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;
                
            case 'auth/me':
                if ($requestMethod === 'GET') {
                    require_once __DIR__ . '/api/auth/me.php';
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;
                
            case 'customers':
                require_once __DIR__ . '/api/customers.php';
                break;
                
            case 'vehicles':
                require_once __DIR__ . '/api/vehicles.php';
                break;
                
            case 'services':
                require_once __DIR__ . '/api/services.php';
                break;
                
            case 'service-types':
                require_once __DIR__ . '/api/service-types.php';
                break;
                
            case 'bookings':
                require_once __DIR__ . '/api/bookings.php';
                break;
                
            case 'inventory':
                require_once __DIR__ . '/api/inventory.php';
                break;
                
            case 'staff':
                require_once __DIR__ . '/api/staff.php';
                break;
                
            case 'warranties':
                require_once __DIR__ . '/api/warranties.php';
                break;
                
            case 'alerts':
                require_once __DIR__ . '/api/alerts.php';
                break;
                
            case 'notifications':
                require_once __DIR__ . '/api/notifications.php';
                break;
                
            case 'dashboard/stats':
                if ($requestMethod === 'GET') {
                    require_once __DIR__ . '/api/dashboard/stats.php';
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;
                
            case 'dashboard/analytics':
                if ($requestMethod === 'GET') {
                    require_once __DIR__ . '/api/dashboard/analytics.php';
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;
                
            case 'reports/summary':
                if ($requestMethod === 'GET') {
                    require_once __DIR__ . '/api/reports/summary.php';
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;
                
            case 'reports/customer':
                if ($requestMethod === 'GET') {
                    require_once __DIR__ . '/api/reports/customer.php';
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;
                
            case 'reports/warranty':
                if ($requestMethod === 'GET') {
                    require_once __DIR__ . '/api/reports/warranty.php';
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;
                
            case 'settings':
                require_once __DIR__ . '/api/settings.php';
                break;
                
            default:
                Response::error('Endpoint not found', 404);
                break;
        }
    } else {
        Response::error('Invalid API path', 404);
    }
    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    Response::error('Internal server error', 500);
}
?>
