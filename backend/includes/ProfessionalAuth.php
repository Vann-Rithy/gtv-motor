<?php
/**
 * Professional Authentication System
 * GTV Motor PHP Backend - Production Ready
 */

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/includes/Response.php';

class ProfessionalAuth {
    private $db;
    private $jwtSecret;
    private $jwtExpiry;

    public function __construct() {
        require_once __DIR__ . '/config/database.php';
        $database = new Database();
        $this->db = $database->getConnection();
        $this->jwtSecret = JWT_SECRET;
        $this->jwtExpiry = JWT_EXPIRY;
    }

    /**
     * Professional login with comprehensive security
     */
    public function login($email, $password, $ip = null, $userAgent = null) {
        try {
            // Rate limiting check
            if (!$this->checkRateLimit($email, $ip)) {
                Response::error('Too many login attempts. Please try again later.', 429);
            }

            // Input validation
            $email = filter_var($email, FILTER_VALIDATE_EMAIL);
            if (!$email) {
                Response::validationError(['email' => 'Invalid email format'], 'Invalid email format');
            }

            // Get user with proper error handling
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
                Response::error('Invalid email or password', 401);
            }

            // Check if account is locked
            if ($this->isAccountLocked($user['id'])) {
                Response::error('Account is temporarily locked due to multiple failed attempts', 423);
            }

            // Update last login
            $this->updateLastLogin($user['id'], $ip, $userAgent);

            // Create JWT token
            $token = $this->createJWTToken($user);

            // Create session record for tracking
            $sessionId = $this->createSessionRecord($user['id'], $token, $ip, $userAgent);

            // Log successful login
            $this->logLoginAttempt($email, $ip, $userAgent, true);

            // Remove sensitive data
            unset($user['password_hash']);
            unset($user['password_reset_token']);
            unset($user['password_reset_expires']);

            // Return professional response
            Response::success([
                'user' => $user,
                'access_token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => $this->jwtExpiry,
                'session_id' => $sessionId
            ], 'Login successful');

        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage());
            Response::error('Login failed', 500);
        }
    }

    /**
     * Validate JWT token and return user
     */
    public function validateToken($token) {
        try {
            if (!$token) {
                return false;
            }

            // Remove 'Bearer ' prefix if present
            $token = str_replace('Bearer ', '', $token);

            // Decode JWT
            $payload = $this->decodeJWT($token);

            if (!$payload) {
                return false;
            }

            // Check if token is expired
            if ($payload['exp'] < time()) {
                return false;
            }

            // Get user from database
            $stmt = $this->db->prepare("
                SELECT u.*, s.name as staff_name, s.role as staff_role
                FROM users u
                LEFT JOIN staff s ON u.staff_id = s.id
                WHERE u.id = ? AND u.is_active = 1
            ");
            $stmt->execute([$payload['user_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                return false;
            }

            // Remove sensitive data
            unset($user['password_hash']);
            unset($user['password_reset_token']);
            unset($user['password_reset_expires']);

            return $user;

        } catch (Exception $e) {
            error_log("Token validation error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Create JWT token
     */
    private function createJWTToken($user) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'iat' => time(),
            'exp' => time() + $this->jwtExpiry,
            'iss' => 'gtv-motor-api',
            'aud' => 'gtv-motor-frontend'
        ]);

        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $this->jwtSecret, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }

    /**
     * Decode JWT token
     */
    private function decodeJWT($token) {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return false;
        }

        list($base64Header, $base64Payload, $base64Signature) = $parts;

        // Verify signature
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $this->jwtSecret, true);
        $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        if (!hash_equals($base64Signature, $expectedSignature)) {
            return false;
        }

        // Decode payload
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Payload)), true);

        return $payload;
    }

    /**
     * Rate limiting check
     */
    private function checkRateLimit($email, $ip) {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as attempts
            FROM login_attempts
            WHERE (email = ? OR ip_address = ?)
            AND success = 0
            AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
        ");
        $stmt->execute([$email, $ip]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result['attempts'] < 5; // Max 5 attempts per 15 minutes
    }

    /**
     * Check if account is locked
     */
    private function isAccountLocked($userId) {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as attempts
            FROM login_attempts
            WHERE email = (SELECT email FROM users WHERE id = ?)
            AND success = 0
            AND attempted_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result['attempts'] >= 10; // Lock after 10 failed attempts in 1 hour
    }

    /**
     * Create session record
     */
    private function createSessionRecord($userId, $token, $ip, $userAgent) {
        $sessionId = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + $this->jwtExpiry);

        $stmt = $this->db->prepare("
            INSERT INTO user_sessions (id, user_id, expires_at, created_at, updated_at, ip_address, user_agent)
            VALUES (?, ?, ?, NOW(), NOW(), ?, ?)
        ");
        $stmt->execute([$sessionId, $userId, $expiresAt, $ip, $userAgent]);

        return $sessionId;
    }

    /**
     * Update last login
     */
    private function updateLastLogin($userId, $ip, $userAgent) {
        $stmt = $this->db->prepare("
            UPDATE users
            SET last_login = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$userId]);
    }

    /**
     * Log login attempt
     */
    private function logLoginAttempt($email, $ip, $userAgent, $success) {
        $stmt = $this->db->prepare("
            INSERT INTO login_attempts (email, ip_address, success, attempted_at, user_agent)
            VALUES (?, ?, ?, NOW(), ?)
        ");
        $stmt->execute([$email, $ip, $success ? 1 : 0, $userAgent]);
    }

    /**
     * Logout - invalidate session
     */
    public function logout($token) {
        try {
            $payload = $this->decodeJWT($token);
            if ($payload) {
                // Mark session as expired
                $stmt = $this->db->prepare("
                    UPDATE user_sessions
                    SET expires_at = NOW()
                    WHERE user_id = ? AND expires_at > NOW()
                ");
                $stmt->execute([$payload['user_id']]);
            }
            return true;
        } catch (Exception $e) {
            error_log("Logout error: " . $e->getMessage());
            return false;
        }
    }
}
?>
