<?php
/**
 * Authentication Handler
 * GTV Motor PHP Backend
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/Response.php';

class Auth {
    private $db;

    public function __construct() {
        require_once __DIR__ . '/../config/database.php';
        $database = new Database();
        $this->db = $database->getConnection();
    }

    /**
     * Authenticate user with email and password
     */
    public function authenticate($email, $password, $ip = null, $userAgent = null) {
        try {
            $stmt = $this->db->prepare("
                SELECT u.*, s.name as staff_name, s.role as staff_role
                FROM users u
                LEFT JOIN staff s ON u.staff_id = s.id
                WHERE u.email = ? AND u.is_active = 1
            ");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user || !password_verify($password, $user['password_hash'])) {
                $this->logLoginAttempt($email, $ip, $userAgent, false);
                return false;
            }

            // Update last login
            $this->updateLastLogin($user['id'], $ip, $userAgent);

            // Remove sensitive data
            unset($user['password_hash']);
            unset($user['password_reset_token']);
            unset($user['password_reset_expires']);

            return $user;

        } catch (Exception $e) {
            error_log("Authentication error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Create user session
     */
    public function createSession($userId) {
        try {
            $sessionId = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', time() + JWT_EXPIRY);

            $stmt = $this->db->prepare("
                INSERT INTO user_sessions (id, user_id, expires_at, created_at, updated_at)
                VALUES (?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([$sessionId, $userId, $expiresAt]);

            return $sessionId;

        } catch (Exception $e) {
            error_log("Session creation error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Validate session
     */
    public function validateSession($sessionId) {
        try {
            $stmt = $this->db->prepare("
                SELECT u.*, s.name as staff_name, s.role as staff_role
                FROM user_sessions us
                JOIN users u ON us.user_id = u.id
                LEFT JOIN staff s ON u.staff_id = s.id
                WHERE us.id = ? AND us.expires_at > NOW() AND u.is_active = 1
            ");
            $stmt->execute([$sessionId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                // Update session
                $this->updateSession($sessionId);
                unset($user['password_hash']);
                return $user;
            }

            return false;

        } catch (Exception $e) {
            error_log("Session validation error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Destroy session
     */
    public function destroySession($sessionId) {
        try {
            $stmt = $this->db->prepare("DELETE FROM user_sessions WHERE id = ?");
            $stmt->execute([$sessionId]);
            return true;
        } catch (Exception $e) {
            error_log("Session destruction error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get current user from session
     */
    public function getCurrentUser() {
        $sessionId = $this->getSessionId();
        if (!$sessionId) {
            return false;
        }

        return $this->validateSession($sessionId);
    }

    /**
     * Require authentication
     */
    public function requireAuth() {
        $user = $this->getCurrentUser();
        if (!$user) {
            Response::unauthorized('Authentication required');
        }
        return $user;
    }

    /**
     * Require specific role
     */
    public function requireRole($requiredRole) {
        $user = $this->requireAuth();

        if ($user['role'] !== $requiredRole && $user['role'] !== ROLE_ADMIN) {
            Response::forbidden('Insufficient permissions');
        }

        return $user;
    }

    /**
     * Check if user has permission
     */
    public function hasPermission($permission) {
        $user = $this->getCurrentUser();
        if (!$user) {
            return false;
        }

        // Admin has all permissions
        if ($user['role'] === ROLE_ADMIN) {
            return true;
        }

        // Check specific permissions based on role
        $permissions = $this->getRolePermissions($user['role']);
        return in_array($permission, $permissions);
    }

    /**
     * Get role permissions
     */
    private function getRolePermissions($role) {
        $permissions = [
            ROLE_ADMIN => ['*'], // All permissions
            ROLE_MANAGER => [
                'customers.read', 'customers.write', 'customers.delete',
                'vehicles.read', 'vehicles.write', 'vehicles.delete',
                'services.read', 'services.write', 'services.delete',
                'bookings.read', 'bookings.write', 'bookings.delete',
                'inventory.read', 'inventory.write', 'inventory.delete',
                'reports.read', 'analytics.read', 'dashboard.read'
            ],
            ROLE_SERVICE_ADVISOR => [
                'customers.read', 'customers.write',
                'vehicles.read', 'vehicles.write',
                'services.read', 'services.write',
                'bookings.read', 'bookings.write',
                'inventory.read', 'inventory.write',
                'reports.read', 'dashboard.read'
            ],
            ROLE_TECHNICIAN => [
                'services.read', 'services.write',
                'vehicles.read',
                'inventory.read',
                'dashboard.read'
            ],
            ROLE_VIEWER => [
                'customers.read', 'vehicles.read', 'services.read',
                'bookings.read', 'inventory.read', 'reports.read',
                'analytics.read', 'dashboard.read'
            ]
        ];

        return $permissions[$role] ?? [];
    }

    /**
     * Get session ID from cookie or header
     */
    private function getSessionId() {
        // Check cookie first
        if (isset($_COOKIE['session'])) {
            return $_COOKIE['session'];
        }

        // Check Authorization header
        $auth = Request::authorization();
        if ($auth) {
            return $auth;
        }

        return null;
    }

    /**
     * Update last login
     */
    private function updateLastLogin($userId, $ip, $userAgent) {
        try {
            $stmt = $this->db->prepare("
                UPDATE users
                SET last_login = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$userId]);

            $this->logLoginAttempt($userId, $ip, $userAgent, true);

        } catch (Exception $e) {
            error_log("Last login update error: " . $e->getMessage());
        }
    }

    /**
     * Update session timestamp
     */
    private function updateSession($sessionId) {
        try {
            $stmt = $this->db->prepare("
                UPDATE user_sessions
                SET updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$sessionId]);
        } catch (Exception $e) {
            error_log("Session update error: " . $e->getMessage());
        }
    }

    /**
     * Log login attempt
     */
    private function logLoginAttempt($email, $ip, $userAgent, $success) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO login_attempts (email, ip_address, success, attempted_at, user_agent)
                VALUES (?, ?, ?, NOW(), ?)
            ");
            $stmt->execute([$email, $ip, $success ? 1 : 0, $userAgent]);
        } catch (Exception $e) {
            error_log("Login attempt logging error: " . $e->getMessage());
        }
    }

    /**
     * Hash password
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    /**
     * Generate password reset token
     */
    public function generatePasswordResetToken($email) {
        try {
            $token = bin2hex(random_bytes(32));
            $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour

            $stmt = $this->db->prepare("
                UPDATE users
                SET password_reset_token = ?, password_reset_expires = ?
                WHERE email = ? AND is_active = 1
            ");
            $stmt->execute([$token, $expires, $email]);

            return $token;

        } catch (Exception $e) {
            error_log("Password reset token generation error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Reset password with token
     */
    public function resetPassword($token, $newPassword) {
        try {
            $stmt = $this->db->prepare("
                SELECT id FROM users
                WHERE password_reset_token = ?
                AND password_reset_expires > NOW()
                AND is_active = 1
            ");
            $stmt->execute([$token]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                return false;
            }

            $hashedPassword = self::hashPassword($newPassword);

            $stmt = $this->db->prepare("
                UPDATE users
                SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL
                WHERE id = ?
            ");
            $stmt->execute([$hashedPassword, $user['id']]);

            return true;

        } catch (Exception $e) {
            error_log("Password reset error: " . $e->getMessage());
            return false;
        }
    }
}
?>
