<?php
/**
 * Professional Authentication Login API
 * GTV Motor PHP Backend
 */

require_once __DIR__ . '/../../includes/ProfessionalAuth.php';
require_once __DIR__ . '/../../includes/Request.php';

try {
    $data = Request::body();
    Request::validateRequired($data, ['email', 'password']);

    $email = Request::sanitize($data['email']);
    $password = $data['password'];
    $ip = Request::ip();
    $userAgent = Request::userAgent();

    $auth = new ProfessionalAuth();
    $auth->login($email, $password, $ip, $userAgent);

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    Response::error('Login failed', 500);
}
?>
