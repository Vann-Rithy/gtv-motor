<?php
/**
 * Get Current User API
 * GTV Motor PHP Backend
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/Response.php';
require_once __DIR__ . '/../../includes/Auth.php';

try {
    $auth = new Auth();
    $user = $auth->requireAuth();
    
    Response::success($user, 'User data retrieved successfully');
    
} catch (Exception $e) {
    error_log("Get user error: " . $e->getMessage());
    Response::error('Failed to get user data', 500);
}
?>
