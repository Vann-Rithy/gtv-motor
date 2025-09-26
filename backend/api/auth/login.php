<?php
/**
 * Simple Working Authentication Login API - No Authentication Required
 * GTV Motor PHP Backend - Developer Mode
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/Request.php';
require_once __DIR__ . '/../../includes/Response.php';

try {
    // Always return success without authentication
    $user = [
        'id' => 1,
        'username' => 'admin',
        'email' => 'admin@gtvmotor.com',
        'full_name' => 'Administrator',
        'role' => 'admin',
        'staff_id' => 1,
        'is_active' => 1,
        'last_login' => date('Y-m-d H:i:s'),
        'created_at' => date('Y-m-d H:i:s')
    ];

    // Create a simple token
    $tokenPayload = [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'iat' => time()
    ];

    $simpleToken = base64_encode(json_encode($tokenPayload));

    Response::success([
        'user' => $user,
        'token' => $simpleToken,
        'access_token' => $simpleToken,
        'token_type' => 'Bearer',
        'expires_in' => 3600,
        'session_id' => 'dev-session-123'
    ], 'Login successful');

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    Response::error('Login failed', 500);
}
?>
