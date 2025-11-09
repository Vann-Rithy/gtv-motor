<?php
/**
 * API v1 Configuration Example
 * GTV Motor PHP Backend - API Configuration Template
 *
 * IMPORTANT: Copy this file to config.php and update with your actual API keys
 * NEVER commit config.php to version control
 */

// API Keys Configuration
// Store API keys securely - In production, use environment variables or secure key management
define('API_V1_KEYS', [
    // Example API key - Generate a secure key for production
    // You can generate keys using: hash('sha256', 'your_secret_string' . date('Y'))
    'your_secure_api_key_here' => [
        'name' => 'Production API Key',
        'permissions' => ['read', 'write'], // Options: 'read', 'write', '*'
        'rate_limit' => 1000, // requests per hour
        'active' => true
    ],

    // Read-only API key example
    'readonly_api_key_here' => [
        'name' => 'Read-Only API Key',
        'permissions' => ['read'],
        'rate_limit' => 500,
        'active' => true
    ],

    // Add more API keys as needed
]);

// API Settings
define('API_V1_VERSION', '1.0.0');
define('API_V1_BASE_URL', 'https://api.gtvmotor.dev/v1/');
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

/**
 * How to Generate Secure API Keys:
 *
 * Option 1: Using PHP
 * <?php
 * echo hash('sha256', 'your_secret_string_' . date('Y'));
 * ?>
 *
 * Option 2: Using command line
 * echo -n "your_secret_string_2024" | sha256sum
 *
 * Option 3: Using online tool
 * Visit: https://emn178.github.io/online-tools/sha256.html
 *
 * Best Practices:
 * 1. Use long, random strings
 * 2. Include timestamp or version in key generation
 * 3. Store keys securely (environment variables, key management service)
 * 4. Rotate keys periodically
 * 5. Never commit keys to version control
 */

?>

