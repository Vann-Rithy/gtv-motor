<?php
/**
 * Authentication Logout API
 * GTV Motor PHP Backend - Updated for Token Authentication
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

            if (!$payload || !isset($payload['user_id'])) {
                Response::unauthorized('Invalid token format');
            }

            // No expiration check - token never expires for user-friendly experience

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

    } catch (Exception $e) {
        Response::unauthorized('Invalid token');
    }

    // Clear session cookie
    setcookie('session', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => APP_ENV === 'production',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    Response::success(null, 'Logout successful');

} catch (Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    Response::error('Logout failed', 500);
}
?>
