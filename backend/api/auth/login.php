<?php
/**
 * Simple Working Authentication Login API
 * GTV Motor PHP Backend - Quick Fix Version
 */

require_once __DIR__ . '/../../includes/Auth.php';
require_once __DIR__ . '/../../includes/Request.php';

try {
    $data = Request::body();
    Request::validateRequired($data, ['email', 'password']);

    $email = Request::sanitize($data['email']);
    $password = $data['password'];
    $ip = Request::ip();
    $userAgent = Request::userAgent();

    $auth = new Auth();
    $user = $auth->authenticate($email, $password, $ip, $userAgent);

    if (!$user) {
        Response::error('Invalid email or password', 401);
    }

            // Create simple token (base64 encoded JSON) - No expiration for user-friendly experience
            $tokenPayload = [
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'iat' => time()
                // Removed 'exp' field - token never expires
            ];

    $simpleToken = base64_encode(json_encode($tokenPayload));

    // Create session record for tracking
    $sessionId = $auth->createSession($user['id']);

    // Remove sensitive data
    unset($user['password_hash']);
    unset($user['password_reset_token']);
    unset($user['password_reset_expires']);

    Response::success([
        'user' => $user,
        'token' => $simpleToken,  // Frontend expects 'token', not 'access_token'
        'access_token' => $simpleToken,
        'token_type' => 'Bearer',
        'expires_in' => 3600,
        'session_id' => $sessionId
    ], 'Login successful');

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    Response::error('Login failed', 500);
}
?>
