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
                // Support URL parameter authentication
                if (isset($_GET['token'])) {
                    // Handle URL parameter authentication
                    try {
                        $token = $_GET['token'];

                        // Validate token
                        $payload = json_decode(base64_decode($token), true);

                        if (!$payload || !isset($payload['user_id']) || !isset($payload['exp'])) {
                            Response::unauthorized('Invalid token format');
                        }

                        if ($payload['exp'] < time()) {
                            Response::unauthorized('Token expired');
                        }

                        // Get user from database
                        require_once __DIR__ . '/config/database.php';
                        $database = new Database();
                        $conn = $database->getConnection();

                        $stmt = $conn->prepare("
                            SELECT u.*, s.name as staff_name, s.role as staff_role
                            FROM users u
                            LEFT JOIN staff s ON u.staff_id = s.id
                            WHERE u.id = ? AND u.is_active = 1
                        ");
                        $stmt->execute([$payload['user_id']]);
                        $user = $stmt->fetch(PDO::FETCH_ASSOC);

                        if (!$user) {
                            Response::unauthorized('User not found or inactive');
                        }

                        unset($user['password_hash']);
                        unset($user['password_reset_token']);
                        unset($user['password_reset_expires']);

                        Response::success($user, 'User data retrieved successfully');

                    } catch (Exception $e) {
                        Response::unauthorized('Invalid token');
                    }
                } else {
                    // Use original me.php for other authentication methods
                    require_once __DIR__ . '/api/auth/me.php';
                }
                break;

            case 'customers':
                // Check if there's a customer ID in the URL
                $customerId = Request::segment(3);
                if ($customerId && is_numeric($customerId)) {
                    // Handle individual customer requests (GET /api/customers/1)
                    if ($requestMethod === 'GET') {
                        require_once __DIR__ . '/api/customers.php';
                    } else {
                        Response::error('Method not allowed', 405);
                    }
                } else {
                    // Handle general customers requests (GET /api/customers)
                    require_once __DIR__ . '/api/customers.php';
                }
                break;

            case 'vehicles':
                // Check if there's a vehicle ID in the URL
                $vehicleId = Request::segment(3);
                if ($vehicleId && is_numeric($vehicleId)) {
                    // Handle individual vehicle requests (GET /api/vehicles/1)
                    if ($requestMethod === 'GET') {
                        require_once __DIR__ . '/api/vehicles.php';
                    } else {
                        Response::error('Method not allowed', 405);
                    }
                } else {
                    // Handle general vehicles requests (GET /api/vehicles)
                    require_once __DIR__ . '/api/vehicles.php';
                }
                break;

            case 'services':
                // Check if there's a service ID in the URL
                $serviceId = Request::segment(3);
                if ($serviceId && is_numeric($serviceId)) {
                    // Handle individual service requests (GET /api/services/1)
                    if ($requestMethod === 'GET') {
                        require_once __DIR__ . '/api/services.php';
                    } else {
                        Response::error('Method not allowed', 405);
                    }
                } else {
                    // Handle general services requests (GET /api/services)
                    require_once __DIR__ . '/api/services.php';
                }
                break;

            case 'service-types':
                require_once __DIR__ . '/api/service-types.php';
                break;

            case 'bookings':
                // Check if there's a booking ID in the URL
                $bookingId = Request::segment(3);
                if ($bookingId && is_numeric($bookingId)) {
                    // Handle individual booking requests (GET /api/bookings/1)
                    if ($requestMethod === 'GET') {
                        require_once __DIR__ . '/api/bookings.php';
                    } else {
                        Response::error('Method not allowed', 405);
                    }
                } else {
                    // Handle general bookings requests (GET /api/bookings)
                    require_once __DIR__ . '/api/bookings.php';
                }
                break;

            case 'inventory':
                require_once __DIR__ . '/api/inventory.php';
                break;

            case 'staff':
                require_once __DIR__ . '/api/staff.php';
                break;

            case 'warranties':
                // Check if there's a warranty ID in the URL
                $warrantyId = Request::segment(3);
                if ($warrantyId && is_numeric($warrantyId)) {
                    // Handle individual warranty requests (GET /api/warranties/1)
                    if ($requestMethod === 'GET') {
                        require_once __DIR__ . '/api/warranties.php';
                    } else {
                        Response::error('Method not allowed', 405);
                    }
                } else {
                    // Handle general warranties requests (GET /api/warranties)
                    require_once __DIR__ . '/api/warranties.php';
                }
                break;

            case 'alerts':
                require_once __DIR__ . '/api/alerts.php';
                break;

            case 'notifications':
                require_once __DIR__ . '/api/notifications.php';
                break;

            case 'debug-customers':
                require_once __DIR__ . '/api/debug-customers.php';
                break;

            case 'test-simple':
                require_once __DIR__ . '/api/test-simple.php';
                break;

            case 'debug-segments':
                require_once __DIR__ . '/api/debug-segments.php';
                break;

            case 'customers-fresh':
                require_once __DIR__ . '/api/customers-fresh.php';
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
            case 'reports/customer':
            case 'reports/warranty':
            case 'reports/inventory':
                if ($requestMethod === 'GET') {
                    require_once __DIR__ . '/api/reports.php';
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;

            case 'analytics':
                if ($requestMethod === 'GET') {
                    require_once __DIR__ . '/api/analytics.php';
                } else {
                    Response::error('Method not allowed', 405);
                }
                break;

            case 'settings/company':
            case 'settings/system':
            case 'settings/notifications':
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
