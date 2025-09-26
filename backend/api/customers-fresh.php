<?php
/**
 * Customers API - Fresh Start
 * GTV Motor PHP Backend - Completely new file
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Request.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    $token = $_GET['token'] ?? Request::authorization();

    if (!$token) {
        Response::unauthorized('No authorization token provided');
    }

    $token = str_replace('Bearer ', '', $token);
    $payload = json_decode(base64_decode($token), true);

    if (!$payload || !isset($payload['user_id']) || !isset($payload['exp'])) {
        Response::unauthorized('Invalid token format');
    }

    if ($payload['exp'] < time()) {
        Response::unauthorized('Token expired');
    }

    require_once __DIR__ . '/../config/database.php';
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

    $method = Request::method();

    if ($method === 'GET') {
        Response::success([
            'user_id' => $payload['user_id'],
            'user_email' => $user['email'],
            'test' => 'Fresh start successful'
        ], 'Customers API working');
    } else {
        Response::error('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log("Customers API error: " . $e->getMessage());
    Response::error('Failed: ' . $e->getMessage(), 500);
}
?>
