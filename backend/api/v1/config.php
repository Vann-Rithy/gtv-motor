<?php
/**
 * API v1 Configuration
 * GTV Motor PHP Backend - API Configuration for api.gtvmotor.dev/v1/
 */

// API Keys Configuration
// Store API keys securely - In production, use environment variables or secure key management
// Generate your API key using: hash('sha256', 'your_secret_string_' . date('Y'))
define('API_V1_KEYS', [
    // Default API key for testing (CHANGE IN PRODUCTION)
    // Example: Generate with: echo hash('sha256', 'gtvmotor2024' . date('Y'));
    'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6' => [
        'name' => 'GTV Motor API Key',
        'permissions' => ['read', 'write', 'admin'], // Admin permission for API key management
        'rate_limit' => 1000, // requests per hour
        'active' => true
    ],
    // Add more API keys as needed
    // 'your_custom_api_key_here' => [
    //     'name' => 'Custom API Key',
    //     'permissions' => ['read'],
    //     'rate_limit' => 100,
    //     'active' => true
    // ],
]);

// API Settings
define('API_V1_VERSION', '1.0.0');
define('API_V1_BASE_URL', 'https://api.gtvmotor.dev/api/v1/');
define('API_V1_RATE_LIMIT_ENABLED', true);
define('API_V1_DEFAULT_PAGE_SIZE', 20);
define('API_V1_MAX_PAGE_SIZE', 100);

// API Response Format
define('API_V1_RESPONSE_FORMAT', 'json');

// Enable/Disable API endpoints
define('API_V1_ENABLE_CUSTOMERS', true);
define('API_V1_ENABLE_VEHICLES', true);
define('API_V1_ENABLE_SERVICES', true);
define('API_V1_ENABLE_INVOICES', true);

// Security Settings
define('API_V1_REQUIRE_HTTPS', true); // Require HTTPS in production
define('API_V1_ALLOW_ORIGINS', [
    'https://api.gtvmotor.dev',
    'https://app.gtvmotor.dev',
    'https://gtvmotor.dev',
    'https://www.gtvmotor.dev'
]);

// Logging
define('API_V1_LOG_REQUESTS', true);
define('API_V1_LOG_FILE', __DIR__ . '/../../logs/api_v1.log');

?>
