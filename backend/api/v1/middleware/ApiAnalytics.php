<?php
/**
 * API Analytics Middleware
 * GTV Motor PHP Backend - Track API requests for analytics
 */

require_once __DIR__ . '/../../../config/database.php';

class ApiAnalytics {

    private static $startTime;
    private static $requestData = [];

    /**
     * Start tracking request
     */
    public static function startTracking() {
        self::$startTime = microtime(true);
        self::$requestData = [
            'start_time' => self::$startTime,
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN',
            'uri' => $_SERVER['REQUEST_URI'] ?? '',
            'ip' => self::getClientIp(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'referer' => $_SERVER['HTTP_REFERER'] ?? null,
            'request_size' => strlen(file_get_contents('php://input'))
        ];
    }

    /**
     * Log request to database
     */
    public static function logRequest($apiKey, $keyConfig, $statusCode, $responseSize = null, $errorMessage = null) {
        try {
            $database = new Database();
            $db = $database->getConnection();

            $endTime = microtime(true);
            $responseTime = round(($endTime - self::$startTime) * 1000); // Convert to milliseconds

            // Extract endpoint from URI
            $uri = self::$requestData['uri'];
            $path = parse_url($uri, PHP_URL_PATH);
            $endpoint = self::extractEndpoint($path);

            // Get API key identifier (name from config)
            $apiKeyId = $keyConfig['name'] ?? 'Unknown';
            $apiKeyPartial = substr($apiKey, 0, 10) . '...'; // Only store partial key

            // Try to get key name from database if available (for proper linking)
            try {
                $keyHash = hash('sha256', $apiKey);
                $keyStmt = $db->prepare("SELECT key_name FROM api_keys WHERE key_hash = ?");
                $keyStmt->execute([$keyHash]);
                $keyRow = $keyStmt->fetch(PDO::FETCH_ASSOC);
                if ($keyRow) {
                    $apiKeyId = $keyRow['key_name'];
                }
            } catch (Exception $e) {
                // Use config name if database lookup fails
            }

            // Insert into api_requests table
            $stmt = $db->prepare("
                INSERT INTO api_requests (
                    api_key, api_key_id, endpoint, method, status_code,
                    response_time_ms, request_size_bytes, response_size_bytes,
                    ip_address, user_agent, referer, error_message, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");

            $stmt->execute([
                $apiKeyPartial,
                $apiKeyId,
                $endpoint,
                self::$requestData['method'],
                $statusCode,
                $responseTime,
                self::$requestData['request_size'],
                $responseSize,
                self::$requestData['ip'],
                self::$requestData['user_agent'],
                self::$requestData['referer'],
                $errorMessage
            ]);

            // Update analytics summary (async - don't block if it fails)
            self::updateAnalyticsSummary($db, $apiKeyId, $endpoint, $statusCode, $responseTime);

        } catch (Exception $e) {
            // Don't break API if analytics logging fails
            error_log("API Analytics logging error: " . $e->getMessage());
        }
    }

    /**
     * Update analytics summary table
     */
    private static function updateAnalyticsSummary($db, $apiKeyId, $endpoint, $statusCode, $responseTime) {
        try {
            $today = date('Y-m-d');

            // Check if summary exists for today
            $stmt = $db->prepare("
                SELECT id, total_requests, successful_requests, failed_requests,
                       total_response_time_ms, total_request_size_bytes, total_response_size_bytes
                FROM api_analytics_summary
                WHERE date = ? AND api_key_id = ? AND endpoint = ?
            ");
            $stmt->execute([$today, $apiKeyId, $endpoint]);
            $summary = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($summary) {
                // Update existing summary
                $totalRequests = $summary['total_requests'] + 1;
                $successful = $summary['successful_requests'] + ($statusCode >= 200 && $statusCode < 300 ? 1 : 0);
                $failed = $summary['failed_requests'] + ($statusCode >= 400 ? 1 : 0);
                $totalResponseTime = $summary['total_response_time_ms'] + $responseTime;
                $avgResponseTime = round($totalResponseTime / $totalRequests, 2);

                $stmt = $db->prepare("
                    UPDATE api_analytics_summary
                    SET total_requests = ?,
                        successful_requests = ?,
                        failed_requests = ?,
                        total_response_time_ms = ?,
                        avg_response_time_ms = ?,
                        min_response_time_ms = LEAST(COALESCE(min_response_time_ms, ?), ?),
                        max_response_time_ms = GREATEST(COALESCE(max_response_time_ms, ?), ?),
                        updated_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([
                    $totalRequests,
                    $successful,
                    $failed,
                    $totalResponseTime,
                    $avgResponseTime,
                    $responseTime, $responseTime,
                    $responseTime, $responseTime,
                    $summary['id']
                ]);
            } else {
                // Insert new summary
                $stmt = $db->prepare("
                    INSERT INTO api_analytics_summary (
                        date, api_key_id, endpoint, total_requests,
                        successful_requests, failed_requests,
                        total_response_time_ms, avg_response_time_ms,
                        min_response_time_ms, max_response_time_ms,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $stmt->execute([
                    $today,
                    $apiKeyId,
                    $endpoint,
                    $statusCode >= 200 && $statusCode < 300 ? 1 : 0,
                    $statusCode >= 400 ? 1 : 0,
                    $responseTime,
                    $responseTime,
                    $responseTime,
                    $responseTime
                ]);
            }
        } catch (Exception $e) {
            error_log("Analytics summary update error: " . $e->getMessage());
        }
    }

    /**
     * Extract endpoint from path
     */
    private static function extractEndpoint($path) {
        // Remove /v1/ prefix if present
        $path = preg_replace('#^/v1/?#', '', $path);

        // Remove query string
        $path = strtok($path, '?');

        // Remove leading/trailing slashes
        $path = trim($path, '/');

        // Extract endpoint (first part before /)
        $parts = explode('/', $path);
        $endpoint = $parts[0] ?? 'unknown';

        return $endpoint ?: 'root';
    }

    /**
     * Get client IP address
     */
    private static function getClientIp() {
        $ipKeys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_X_CLUSTER_CLIENT_IP', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'];

        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
}

?>

