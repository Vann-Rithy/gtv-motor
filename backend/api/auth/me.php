<?php
/**
 * Simple Working Get Current User API
 * GTV Motor PHP Backend - Quick Fix Version
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/Request.php';
require_once __DIR__ . '/../../includes/Response.php';

try {
    // Get token from URL parameter first, then Authorization header
    $token = $_GET['token'] ?? Request::authorization();

    if (!$token) {
        Response::unauthorized('No authorization token provided');
    }

    // Remove 'Bearer ' prefix if present
    $token = str_replace('Bearer ', '', $token);

    // Simple token validation (base64 encoded JSON)
    try {
        $payload = json_decode(base64_decode($token), true);

        if (!$payload || !isset($payload['user_id']) || !isset($payload['exp'])) {
            Response::unauthorized('Invalid token format');
        }

        // Check if token is expired
        if ($payload['exp'] < time()) {
            Response::unauthorized('Token expired');
        }

        // Get user from database
        require_once __DIR__ . '/../../config/database.php';
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

        // Remove sensitive data
        unset($user['password_hash']);
        unset($user['password_reset_token']);
        unset($user['password_reset_expires']);

        Response::success($user, 'User data retrieved successfully');

    } catch (Exception $e) {
        Response::unauthorized('Invalid token');
    }

} catch (Exception $e) {
    error_log("Get user error: " . $e->getMessage());
    Response::error('Failed to get user data', 500);
}
?>
