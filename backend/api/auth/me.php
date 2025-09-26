<?php
/**
 * Simple Working Get Current User API - No Authentication Required
 * GTV Motor PHP Backend - Developer Mode
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/Request.php';
require_once __DIR__ . '/../../includes/Response.php';

try {
    // Return a default user without authentication
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

    Response::success($user, 'User data retrieved successfully');

} catch (Exception $e) {
    error_log("Get user error: " . $e->getMessage());
    Response::error('Failed to get user data', 500);
}
?>
