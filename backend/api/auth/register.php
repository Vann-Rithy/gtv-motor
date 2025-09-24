<?php
/**
 * Authentication Register API
 * GTV Motor PHP Backend
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/Auth.php';

try {
    $data = Request::body();
    Request::validateRequired($data, ['username', 'email', 'password', 'full_name']);
    
    $username = Request::sanitize($data['username']);
    $email = Request::sanitize($data['email']);
    $password = $data['password'];
    $fullName = Request::sanitize($data['full_name']);
    $role = Request::sanitize($data['role'] ?? 'viewer');
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::validationError(['email' => 'Invalid email format'], 'Invalid email format');
    }
    
    // Validate password strength
    if (strlen($password) < 8) {
        Response::validationError(['password' => 'Password must be at least 8 characters long'], 'Password too weak');
    }
    
    // Validate role
    $allowedRoles = ['admin', 'manager', 'service_advisor', 'technician', 'viewer'];
    if (!in_array($role, $allowedRoles)) {
        Response::validationError(['role' => 'Invalid role'], 'Invalid role');
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if username or email already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingUser) {
        Response::error('Username or email already exists', 409);
    }
    
    // Hash password
    $hashedPassword = Auth::hashPassword($password);
    
    // Create user
    $stmt = $db->prepare("
        INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
    ");
    
    $stmt->execute([$username, $email, $hashedPassword, $fullName, $role]);
    $userId = $db->lastInsertId();
    
    // Get created user (without password)
    $stmt = $db->prepare("
        SELECT id, username, email, full_name, role, is_active, created_at, updated_at
        FROM users WHERE id = ?
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    Response::created($user, 'User registered successfully');
    
} catch (Exception $e) {
    error_log("Registration error: " . $e->getMessage());
    Response::error('Registration failed', 500);
}
?>
