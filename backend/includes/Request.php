<?php
/**
 * Request Handler
 * GTV Motor PHP Backend
 */

class Request {

    /**
     * Get request method
     */
    public static function method() {
        return $_SERVER['REQUEST_METHOD'];
    }

    /**
     * Get request URI
     */
    public static function uri() {
        return $_SERVER['REQUEST_URI'];
    }

    /**
     * Get request body as JSON
     */
    public static function json() {
        $input = file_get_contents('php://input');
        return json_decode($input, true);
    }

    /**
     * Get request body as array
     */
    public static function body() {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        return $data ?: [];
    }

    /**
     * Get query parameters
     */
    public static function query($key = null) {
        if ($key) {
            return $_GET[$key] ?? null;
        }
        return $_GET;
    }

    /**
     * Get POST data
     */
    public static function post($key = null) {
        if ($key) {
            return $_POST[$key] ?? null;
        }
        return $_POST;
    }

    /**
     * Get request headers
     */
    public static function headers($key = null) {
        $headers = getallheaders();
        if ($key) {
            return $headers[$key] ?? null;
        }
        return $headers;
    }

    /**
     * Get authorization header
     */
    public static function authorization() {
        $auth = self::headers('Authorization');
        if ($auth && strpos($auth, 'Bearer ') === 0) {
            return substr($auth, 7);
        }
        return null;
    }

    /**
     * Get client IP address
     */
    public static function ip() {
        $ipKeys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }

    /**
     * Get user agent
     */
    public static function userAgent() {
        return $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    }

    /**
     * Validate required fields
     */
    public static function validateRequired($data, $requiredFields) {
        $missing = [];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $missing[] = $field;
            }
        }

        if (!empty($missing)) {
            Response::validationError($missing, 'Missing required fields: ' . implode(', ', $missing));
        }
    }

    /**
     * Sanitize input data
     */
    public static function sanitize($data) {
        if (is_array($data)) {
            return array_map([self::class, 'sanitize'], $data);
        }
        return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
    }

    /**
     * Get pagination parameters
     */
    public static function getPagination() {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;

        return [
            'page' => $page,
            'limit' => $limit,
            'offset' => $offset
        ];
    }

    /**
     * Get search parameters
     */
    public static function getSearch() {
        return [
            'search' => $_GET['search'] ?? '',
            'sortBy' => $_GET['sortBy'] ?? 'created_at',
            'sortOrder' => ($_GET['sortOrder'] ?? 'desc') === 'asc' ? 'ASC' : 'DESC'
        ];
    }

    /**
     * Get date range parameters
     */
    public static function getDateRange() {
        return [
            'startDate' => $_GET['startDate'] ?? null,
            'endDate' => $_GET['endDate'] ?? null
        ];
    }

    /**
     * Get URI segment by index
     */
    public static function segment($index) {
        if (!isset($_SERVER['REQUEST_URI'])) {
            return null;
        }

        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);

        if (!$path) {
            return null;
        }

        $segments = explode('/', trim($path, '/'));

        // Remove empty segments
        $segments = array_filter($segments, function($segment) {
            return $segment !== '';
        });
        $segments = array_values($segments);

        return isset($segments[$index]) ? $segments[$index] : null;
    }
}
?>
