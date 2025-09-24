<?php
/**
 * Authentication Logout API
 * GTV Motor PHP Backend
 */

require_once __DIR__ . '/../includes/Auth.php';

try {
    $auth = new Auth();
    $user = $auth->requireAuth();
    
    $sessionId = $auth->getSessionId();
    if ($sessionId) {
        $auth->destroySession($sessionId);
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
