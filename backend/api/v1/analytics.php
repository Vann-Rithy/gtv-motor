<?php
/**
 * API Analytics Endpoint
 * GTV Motor PHP Backend - API Traffic Analytics
 * Endpoint: api.gtvmotor.dev/v1/analytics
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/Request.php';
require_once __DIR__ . '/../../includes/Response.php';
require_once __DIR__ . '/middleware/ApiAuth.php';

try {
    // Validate API Key
    $keyConfig = ApiAuth::validateApiKey();

    // Check read permission
    if (!ApiAuth::hasPermission($keyConfig, 'read')) {
        Response::forbidden('API key does not have read permission.');
    }

    // Initialize database
    $database = new Database();
    $db = $database->getConnection();

    $method = Request::method();

    if ($method === 'GET') {
        // Get analytics type from query or path
        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        $segments = array_filter($segments);
        $segments = array_values($segments);

        $analyticsType = Request::query('type') ?? ($segments[2] ?? 'overview');
        $days = (int)(Request::query('days') ?? 7);
        $endpoint = Request::query('endpoint');
        $startDate = Request::query('start_date');
        $endDate = Request::query('end_date');
        $breakdownPeriod = Request::query('breakdown') ?? 'day'; // day, month, year

        switch ($analyticsType) {
            case 'overview':
                // Get overview statistics
                // Check if table exists first
                try {
                    $tableCheck = $db->query("SHOW TABLES LIKE 'api_requests'");
                    if ($tableCheck->rowCount() === 0) {
                        Response::success([
                            'overview' => [
                                'total_requests' => 0,
                                'successful_requests' => 0,
                                'failed_requests' => 0,
                                'avg_response_time_ms' => 0,
                                'min_response_time_ms' => 0,
                                'max_response_time_ms' => 0,
                                'unique_ips' => 0,
                                'unique_api_keys' => 0,
                                'unique_endpoints' => 0
                            ],
                            'by_day' => [],
                            'period_days' => $days
                        ], 'Analytics overview retrieved successfully (no data yet)');
                        break;
                    }
                } catch (Exception $e) {
                    Response::success([
                        'overview' => [
                            'total_requests' => 0,
                            'successful_requests' => 0,
                            'failed_requests' => 0,
                            'avg_response_time_ms' => 0,
                            'min_response_time_ms' => 0,
                            'max_response_time_ms' => 0,
                            'unique_ips' => 0,
                            'unique_api_keys' => 0,
                            'unique_endpoints' => 0
                        ],
                        'by_day' => [],
                        'period_days' => $days
                    ], 'Analytics overview retrieved successfully (table not ready)');
                    break;
                }

                try {
                    $stmt = $db->prepare("
                        SELECT
                            COUNT(*) as total_requests,
                            SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as successful_requests,
                            SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as failed_requests,
                            ROUND(AVG(response_time_ms), 2) as avg_response_time_ms,
                            MIN(response_time_ms) as min_response_time_ms,
                            MAX(response_time_ms) as max_response_time_ms,
                            COUNT(DISTINCT ip_address) as unique_ips,
                            COUNT(DISTINCT api_key_id) as unique_api_keys,
                            COUNT(DISTINCT endpoint) as unique_endpoints
                        FROM api_requests
                        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                    ");
                    $stmt->execute([$days]);
                    $overview = $stmt->fetch(PDO::FETCH_ASSOC);

                    // Get requests by day/month/year based on breakdown period
                    $groupBy = "DATE(created_at)";
                    $dateFormat = "DATE(created_at)";
                    $orderBy = "date DESC";

                    if ($breakdownPeriod === 'month') {
                        $groupBy = "DATE_FORMAT(created_at, '%Y-%m')";
                        $dateFormat = "DATE_FORMAT(created_at, '%Y-%m')";
                        $orderBy = "date DESC";
                    } elseif ($breakdownPeriod === 'year') {
                        $groupBy = "YEAR(created_at)";
                        $dateFormat = "YEAR(created_at)";
                        $orderBy = "date DESC";
                    }

                    $stmt = $db->prepare("
                        SELECT
                            {$dateFormat} as date,
                            COUNT(*) as requests,
                            SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as successful,
                            SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as failed,
                            ROUND(AVG(response_time_ms), 2) as avg_response_time,
                            MIN(response_time_ms) as min_response_time,
                            MAX(response_time_ms) as max_response_time,
                            COUNT(DISTINCT ip_address) as unique_ips,
                            COUNT(DISTINCT api_key_id) as unique_keys
                        FROM api_requests
                        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                        GROUP BY {$groupBy}
                        ORDER BY {$orderBy}
                    ");
                    $stmt->execute([$days]);
                    $byDay = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    Response::success([
                        'overview' => $overview,
                        'by_day' => $byDay,
                        'by_month' => $breakdownPeriod === 'month' ? $byDay : [],
                        'by_year' => $breakdownPeriod === 'year' ? $byDay : [],
                        'period_days' => $days,
                        'breakdown_period' => $breakdownPeriod
                    ], 'Analytics overview retrieved successfully');
                } catch (Exception $e) {
                    error_log("Analytics overview error: " . $e->getMessage());
                    Response::success([
                        'overview' => [
                            'total_requests' => 0,
                            'successful_requests' => 0,
                            'failed_requests' => 0,
                            'avg_response_time_ms' => 0,
                            'min_response_time_ms' => 0,
                            'max_response_time_ms' => 0,
                            'unique_ips' => 0,
                            'unique_api_keys' => 0,
                            'unique_endpoints' => 0
                        ],
                        'by_day' => [],
                        'period_days' => $days
                    ], 'Analytics overview retrieved successfully (error occurred)');
                }
                break;

            case 'endpoints':
                // Get endpoint statistics
                // Check if table exists first
                try {
                    $tableCheck = $db->query("SHOW TABLES LIKE 'api_requests'");
                    if ($tableCheck->rowCount() === 0) {
                        Response::success([], 'Endpoint analytics retrieved successfully (no data yet)');
                        break;
                    }
                } catch (Exception $e) {
                    Response::success([], 'Endpoint analytics retrieved successfully (table not ready)');
                    break;
                }

                $where = ["created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)"];
                $params = [$days];

                if ($endpoint) {
                    $where[] = "endpoint = ?";
                    $params[] = $endpoint;
                }

                $whereClause = 'WHERE ' . implode(' AND ', $where);

                try {
                    $stmt = $db->prepare("
                        SELECT
                            COALESCE(endpoint, 'unknown') as endpoint,
                            COALESCE(method, 'UNKNOWN') as method,
                            COUNT(*) as total_requests,
                            SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as successful_requests,
                            SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as failed_requests,
                            ROUND(AVG(response_time_ms), 2) as avg_response_time_ms,
                            MIN(response_time_ms) as min_response_time_ms,
                            MAX(response_time_ms) as max_response_time_ms,
                            COUNT(DISTINCT ip_address) as unique_ips,
                            ROUND(SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as error_rate_percent
                        FROM api_requests
                        {$whereClause}
                        GROUP BY endpoint, method
                        HAVING total_requests > 0
                        ORDER BY total_requests DESC
                    ");
                    $stmt->execute($params);
                    $endpoints = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } catch (Exception $e) {
                    error_log("Analytics endpoints error: " . $e->getMessage());
                    $endpoints = [];
                }

                Response::success($endpoints, 'Endpoint analytics retrieved successfully');
                break;

            case 'keys':
                // Get API key usage statistics
                // Check if table exists first
                try {
                    $tableCheck = $db->query("SHOW TABLES LIKE 'api_requests'");
                    if ($tableCheck->rowCount() === 0) {
                        Response::success([], 'API key analytics retrieved successfully (no data yet)');
                        break;
                    }
                } catch (Exception $e) {
                    Response::success([], 'API key analytics retrieved successfully (table not ready)');
                    break;
                }

                // Join with api_keys to get status and other details
                try {
                    $stmt = $db->prepare("
                        SELECT
                            COALESCE(ar.api_key_id, 'Unknown') as api_key_id,
                            COUNT(*) as total_requests,
                            SUM(CASE WHEN ar.status_code >= 200 AND ar.status_code < 300 THEN 1 ELSE 0 END) as successful_requests,
                            SUM(CASE WHEN ar.status_code >= 400 THEN 1 ELSE 0 END) as failed_requests,
                            ROUND(AVG(ar.response_time_ms), 2) as avg_response_time_ms,
                            COUNT(DISTINCT ar.endpoint) as endpoints_used,
                            COUNT(DISTINCT ar.ip_address) as unique_ips,
                            MIN(ar.created_at) as first_request,
                            MAX(ar.created_at) as last_request,
                            COALESCE(ak.active, 1) as key_active,
                            COALESCE(ak.rate_limit, 1000) as rate_limit
                        FROM api_requests ar
                        LEFT JOIN api_keys ak ON ak.key_name COLLATE utf8mb4_unicode_ci = ar.api_key_id COLLATE utf8mb4_unicode_ci
                        WHERE ar.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                        GROUP BY ar.api_key_id, ak.active, ak.rate_limit
                        HAVING total_requests > 0
                        ORDER BY total_requests DESC
                    ");
                    $stmt->execute([$days]);
                    $keys = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } catch (Exception $e) {
                    error_log("Analytics keys error: " . $e->getMessage());
                    $keys = [];
                }

                Response::success($keys, 'API key analytics retrieved successfully');
                break;

            case 'errors':
                // Get error analysis
                $stmt = $db->prepare("
                    SELECT
                        status_code,
                        endpoint,
                        method,
                        error_message,
                        COUNT(*) as error_count,
                        COUNT(DISTINCT ip_address) as affected_ips,
                        MAX(created_at) as last_occurrence
                    FROM api_requests
                    WHERE status_code >= 400
                    AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                    GROUP BY status_code, endpoint, method, error_message
                    ORDER BY error_count DESC
                    LIMIT 100
                ");
                $stmt->execute([$days]);
                $errors = $stmt->fetchAll(PDO::FETCH_ASSOC);

                Response::success($errors, 'Error analytics retrieved successfully');
                break;

            case 'performance':
                // Get performance metrics
                $stmt = $db->prepare("
                    SELECT
                        DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
                        endpoint,
                        COUNT(*) as requests,
                        ROUND(AVG(response_time_ms), 2) as avg_response_time_ms,
                        MIN(response_time_ms) as min_response_time_ms,
                        MAX(response_time_ms) as max_response_time_ms,
                        ROUND(SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as error_rate_percent
                    FROM api_requests
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                    " . ($endpoint ? "AND endpoint = ?" : "") . "
                    GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00'), endpoint
                    ORDER BY hour DESC
                ");
                $params = [$days];
                if ($endpoint) {
                    $params[] = $endpoint;
                }
                $stmt->execute($params);
                $performance = $stmt->fetchAll(PDO::FETCH_ASSOC);

                Response::success($performance, 'Performance analytics retrieved successfully');
                break;

            case 'traffic':
                // Get traffic overview (last 24 hours by hour)
                $stmt = $db->prepare("
                    SELECT
                        HOUR(created_at) as hour,
                        COUNT(*) as requests,
                        SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as successful,
                        SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as failed,
                        ROUND(AVG(response_time_ms), 2) as avg_response_time,
                        COUNT(DISTINCT ip_address) as unique_ips
                    FROM api_requests
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                    GROUP BY HOUR(created_at)
                    ORDER BY hour DESC
                ");
                $stmt->execute();
                $traffic = $stmt->fetchAll(PDO::FETCH_ASSOC);

                Response::success($traffic, 'Traffic analytics retrieved successfully');
                break;

            default:
                Response::error('Invalid analytics type. Available: overview, endpoints, keys, errors, performance, traffic', 400);
        }

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("API Analytics error: " . $e->getMessage());
    Response::error('Failed to retrieve analytics', 500);
}
?>

