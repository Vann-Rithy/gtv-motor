<?php
/**
 * Application Configuration
 * GTV Motor PHP Backend
 */

// Load environment variables
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Set default timezone
date_default_timezone_set($_ENV['TIMEZONE'] ?? 'Asia/Phnom_Penh');

// CORS headers - Allow specific origins for security
$allowed_origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: http://localhost:3000');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // 24 hours
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Error reporting
if ($_ENV['APP_ENV'] === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', $_ENV['APP_ENV'] === 'production' ? 1 : 0);
ini_set('session.use_only_cookies', 1);

// Application constants
define('APP_NAME', 'GTV Motor');
define('APP_VERSION', '1.0.0');
define('APP_ENV', $_ENV['APP_ENV'] ?? 'development');

// Database constants
define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'gtv_motor_php');
define('DB_USER', $_ENV['DB_USER'] ?? 'root');
define('DB_PASS', $_ENV['DB_PASSWORD'] ?? '');
define('DB_PORT', $_ENV['DB_PORT'] ?? '3306');

// JWT Configuration
define('JWT_SECRET', $_ENV['JWT_SECRET'] ?? 'your-secret-key-change-this-in-production');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRY', 7 * 24 * 60 * 60); // 7 days in seconds

// File upload configuration
define('UPLOAD_MAX_SIZE', 5 * 1024 * 1024); // 5MB
define('UPLOAD_ALLOWED_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']);

// Pagination defaults
define('DEFAULT_PAGE_SIZE', 10);
define('MAX_PAGE_SIZE', 100);

// Service statuses
define('SERVICE_STATUS_PENDING', 'pending');
define('SERVICE_STATUS_IN_PROGRESS', 'in_progress');
define('SERVICE_STATUS_COMPLETED', 'completed');
define('SERVICE_STATUS_CANCELLED', 'cancelled');

// Payment statuses
define('PAYMENT_STATUS_PENDING', 'pending');
define('PAYMENT_STATUS_PAID', 'paid');
define('PAYMENT_STATUS_CANCELLED', 'cancelled');

// Payment methods
define('PAYMENT_METHOD_CASH', 'cash');
define('PAYMENT_METHOD_ABA', 'aba');
define('PAYMENT_METHOD_CARD', 'card');
define('PAYMENT_METHOD_BANK_TRANSFER', 'bank_transfer');

// User roles
define('ROLE_ADMIN', 'admin');
define('ROLE_MANAGER', 'manager');
define('ROLE_SERVICE_ADVISOR', 'service_advisor');
define('ROLE_TECHNICIAN', 'technician');
define('ROLE_VIEWER', 'viewer');

// Alert types
define('ALERT_TYPE_SERVICE_DUE', 'service_due');
define('ALERT_TYPE_WARRANTY_EXPIRING', 'warranty_expiring');
define('ALERT_TYPE_FOLLOW_UP', 'follow_up');

// Alert statuses
define('ALERT_STATUS_PENDING', 'pending');
define('ALERT_STATUS_SENT', 'sent');
define('ALERT_STATUS_COMPLETED', 'completed');

// Booking statuses
define('BOOKING_STATUS_CONFIRMED', 'confirmed');
define('BOOKING_STATUS_IN_PROGRESS', 'in_progress');
define('BOOKING_STATUS_COMPLETED', 'completed');
define('BOOKING_STATUS_CANCELLED', 'cancelled');
define('BOOKING_STATUS_NO_SHOW', 'no_show');

// Inventory movement types
define('MOVEMENT_TYPE_IN', 'in');
define('MOVEMENT_TYPE_OUT', 'out');
define('MOVEMENT_TYPE_ADJUSTMENT', 'adjustment');

// Reference types
define('REFERENCE_TYPE_PURCHASE', 'purchase');
define('REFERENCE_TYPE_SERVICE', 'service');
define('REFERENCE_TYPE_ADJUSTMENT', 'adjustment');
define('REFERENCE_TYPE_RETURN', 'return');
?>
