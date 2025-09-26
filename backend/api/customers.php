<?php
/**
 * Customers API
 * GTV Motor PHP Backend - Updated for Token Authentication
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Request.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    // No authentication required - Developer Mode
    // Get customers from database
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

        if ($customerId && is_numeric($customerId)) {
            // Get individual customer by ID
            $stmt = $db->prepare("
                SELECT
                    id,
                    name,
                    phone,
                    address,
                    email,
                    created_at,
                    updated_at
                FROM customers
                WHERE id = ?
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

        if (!empty($search['search'])) {
            $where[] = "(name LIKE ? OR phone LIKE ? OR email LIKE ?)";
            $searchTerm = '%' . $search['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $query = "
            SELECT
                id,
                name,
                phone,
                address,
                email,
                created_at,
                updated_at
            FROM customers
            {$whereClause}
            ORDER BY {$search['sortBy']} {$search['sortOrder']}
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";

        $customers = $db->prepare($query);
        $customers->execute($params);
        $customers = $customers->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $countQuery = "
            SELECT COUNT(id) as total
            FROM customers
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

        $stmt = $db->prepare("
            INSERT INTO customers (name, phone, address, email)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['name'],
            $data['phone'],
            $data['address'] ?? null,
            $data['email'] ?? null
        ]);

        Response::success(['id' => $db->lastInsertId()], 'Customer created successfully', 201);

    } elseif ($method === 'PUT') {
        // Update customer
        $customerId = Request::segment(3);
        if (!$customerId) {
            Response::error('Customer ID is required', 400);
        }

        $data = Request::body();
        Request::validateRequired($data, ['name', 'phone']);

        $stmt = $db->prepare("
            UPDATE customers
            SET name = ?, phone = ?, address = ?, email = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $data['name'],
            $data['phone'],
            $data['address'] ?? null,
            $data['email'] ?? null,
            $customerId
        ]);

        Response::success(null, 'Customer updated successfully');

    } elseif ($method === 'DELETE') {
        // Delete customer
        $customerId = Request::segment(3);
        if (!$customerId) {
            Response::error('Customer ID is required', 400);
        }

        $stmt = $db->prepare("DELETE FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);

        Response::success(null, 'Customer deleted successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Customers API error: " . $e->getMessage());
    Response::error('Failed to process customers request', 500);
}
?>