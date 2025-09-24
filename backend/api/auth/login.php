<?php
/**
 * Authentication Login API
 * GTV Motor PHP Backend
 */

require_once __DIR__ . '/../includes/Auth.php';

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
    
    $sessionId = $auth->createSession($user['id']);
    
    if (!$sessionId) {
        Response::error('Failed to create session', 500);
    }
    
    // Set session cookie
    setcookie('session', $sessionId, [
        'expires' => time() + JWT_EXPIRY,
        'path' => '/',
        'secure' => APP_ENV === 'production',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    
    Response::success([
        'user' => $user,
        'session_id' => $sessionId
    ], 'Login successful');
    
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    Response::error('Login failed', 500);
}
?>
