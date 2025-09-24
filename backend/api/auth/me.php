<?php
/**
 * Professional Get Current User API
 * GTV Motor PHP Backend
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/Request.php';
require_once __DIR__ . '/../../includes/Response.php';
require_once __DIR__ . '/../../includes/ProfessionalAuth.php';

try {
    $auth = new ProfessionalAuth();

    // Get token from Authorization header
    $token = Request::authorization();

    if (!$token) {
        Response::unauthorized('No authorization token provided');
    }

    // Validate token and get user
    $user = $auth->validateToken($token);

    if (!$user) {
        Response::unauthorized('Invalid or expired token');
    }

    Response::success($user, 'User data retrieved successfully');

} catch (Exception $e) {
    error_log("Get user error: " . $e->getMessage());
    Response::error('Failed to get user data', 500);
}
?>
