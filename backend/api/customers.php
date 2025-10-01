<?php
/**
 * Customers API - Simplified Version
 * GTV Motor PHP Backend
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Request.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    require_once __DIR__ . '/../config/database.php';
    $database = new Database();
    $db = $database->getConnection();

    $method = Request::method();

    if ($method === 'GET') {
        // Check if requesting individual customer
        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        $segments = array_filter($segments);
        $segments = array_values($segments);

        $customerId = null;
        if (isset($segments[2]) && is_numeric($segments[2])) {
            $customerId = $segments[2];
        }

        if ($customerId && is_numeric($customerId) && $customerId > 0) {
            // Get individual customer by ID
            $stmt = $db->prepare("
                SELECT
                    c.id,
                    c.name,
                    c.phone,
                    c.address,
                    c.email,
                    c.created_at,
                    c.updated_at
                FROM customers c
                WHERE c.id = ? AND c.id > 0
            ");
            $stmt->execute([$customerId]);
            $customer = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$customer) {
                Response::error('Customer not found', 404);
            }

            Response::success($customer, 'Customer retrieved successfully');
            return;
        }

        // Get customers with pagination and search
        $pagination = Request::getPagination();
        $search = Request::getSearch();

        $where = [];
        $params = [];

        // Always filter out customers with invalid IDs
        $where[] = "c.id IS NOT NULL AND c.id > 0";

        if (!empty($search['search'])) {
            $where[] = "(c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)";
            $searchTerm = '%' . $search['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        // Simplified query - just get customers first
        $query = "
            SELECT
                c.id,
                c.name,
                c.phone,
                c.address,
                c.email,
                c.created_at,
                c.updated_at
            FROM customers c
            {$whereClause}
            ORDER BY {$search['sortBy']} {$search['sortOrder']}
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $countQuery = "
            SELECT COUNT(*) as total
            FROM customers c
            {$whereClause}
        ";

        $stmt = $db->prepare($countQuery);
        $stmt->execute($params);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        $paginationData = [
            'total' => (int)$total,
            'page' => $pagination['page'],
            'limit' => $pagination['limit'],
            'totalPages' => ceil($total / $pagination['limit'])
        ];

        Response::paginated($customers, $paginationData, 'Customers retrieved successfully');

    } elseif ($method === 'POST') {
        // Create new customer
        $data = Request::body();
        Request::validateRequired($data, ['name', 'phone']);

        $name = Request::sanitize($data['name']);
        $phone = Request::sanitize($data['phone']);
        $email = Request::sanitize($data['email'] ?? '');
        $address = Request::sanitize($data['address'] ?? '');

        // Check if customer with same phone already exists
        $stmt = $db->prepare("SELECT id FROM customers WHERE phone = ?");
        $stmt->execute([$phone]);
        if ($stmt->fetch()) {
            Response::error('Customer with this phone number already exists', 409);
        }

        $stmt = $db->prepare("
            INSERT INTO customers (name, phone, email, address, created_at, updated_at)
            VALUES (?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([$name, $phone, $email, $address]);

        $customerId = $db->lastInsertId();

        // Get the created customer
        $stmt = $db->prepare("
            SELECT id, name, phone, email, address, created_at, updated_at
            FROM customers
            WHERE id = ?
        ");
        $stmt->execute([$customerId]);
        $customer = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::created($customer, 'Customer created successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Customers API error: " . $e->getMessage());
    Response::error('Failed to process customers request', 500);
}
?>