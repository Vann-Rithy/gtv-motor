<?php
/**
 * Authentication Login API
 * GTV Motor PHP Backend - Real Authentication
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/Request.php';
require_once __DIR__ . '/../../includes/Response.php';

try {
    // Get login credentials
    $data = Request::body();

    if (empty($data['email']) || empty($data['password'])) {
        Response::error('Email and password are required', 400);
    }

    $email = trim($data['email']);
    $password = $data['password'];

    // Connect to database
    require_once __DIR__ . '/../../config/database.php';
    $database = new Database();
    $db = $database->getConnection();

    // Check if user exists
    $stmt = $db->prepare("
        SELECT
            id,
            username,
            email,
            full_name,
            role,
            staff_id,
            is_active,
            password_hash,
            last_login,
            created_at
        FROM users
        WHERE email = ? AND is_active = 1
    ");

    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        Response::error('Invalid email or password', 401);
    }

    // Verify password
    if (!password_verify($password, $user['password_hash'])) {
        Response::error('Invalid email or password', 401);
    }

    // Remove password hash from response
    unset($user['password_hash']);

    // Update last login
    $updateStmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $updateStmt->execute([$user['id']]);
    $user['last_login'] = date('Y-m-d H:i:s');

    // Create token
    $tokenPayload = [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'iat' => time()
    ];

    $token = base64_encode(json_encode($tokenPayload));

    Response::success([
        'user' => $user,
        'token' => $token,
        'access_token' => $token,
        'token_type' => 'Bearer',
        'expires_in' => 3600
    ], 'Login successful');

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    Response::error('Login failed', 500);
}
?>
