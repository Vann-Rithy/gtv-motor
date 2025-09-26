<?php
/**
 * Customers API - Working Version
 * GTV Motor PHP Backend - Based on working inventory.php
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Request.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    // Get token from URL parameter first, then Authorization header
    $token = $_GET['token'] ?? Request::authorization();

    if (!$token) {
        Response::unauthorized('No authorization token provided');
    }

    // Remove 'Bearer ' prefix if present
    $token = str_replace('Bearer ', '', $token);

    // Simple token validation (base64 encoded JSON)
    try {
        $payload = json_decode(base64_decode($token), true);

        if (!$payload || !isset($payload['user_id']) || !isset($payload['exp'])) {
            Response::unauthorized('Invalid token format');
        }

        // Check if token is expired
        if ($payload['exp'] < time()) {
            Response::unauthorized('Token expired');
        }

        // Get user from database
        require_once __DIR__ . '/../config/database.php';
        $database = new Database();
        $conn = $database->getConnection();

        $stmt = $conn->prepare("
            SELECT u.*, s.name as staff_name, s.role as staff_role
            FROM users u
            LEFT JOIN staff s ON u.staff_id = s.id
            WHERE u.id = ? AND u.is_active = 1
        ");
        $stmt->execute([$payload['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            Response::unauthorized('User not found or inactive');
        }

    } catch (Exception $e) {
        Response::unauthorized('Invalid token');
    }

    $database = new Database();
    $db = $database->getConnection();

    $method = Request::method();
    $customerId = Request::segment(3); // Get customer ID from URL if present

    if ($method === 'GET') {
        // Check if requesting individual customer
        if ($customerId && is_numeric($customerId)) {
            // Get individual customer by ID
            $stmt = $db->prepare("
                SELECT c.*,
                       COUNT(DISTINCT v.id) as vehicle_count,
                       COUNT(DISTINCT s.id) as service_count,
                       MAX(s.service_date) as last_service_date,
                       SUM(s.total_amount) as total_spent
                FROM customers c
                LEFT JOIN vehicles v ON c.id = v.customer_id
                LEFT JOIN services s ON c.id = s.customer_id
                WHERE c.id = ?
                GROUP BY c.id
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
            $where[] = "(c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)";
            $searchTerm = '%' . $search['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $query = "
            SELECT
                c.id, c.name, c.phone, c.address, c.email, c.created_at, c.updated_at,
                COUNT(DISTINCT v.id) as vehicle_count,
                COUNT(DISTINCT s.id) as service_count,
                MAX(s.service_date) as last_service_date,
                SUM(s.total_amount) as total_spent
            FROM customers c
            LEFT JOIN vehicles v ON c.id = v.customer_id
            LEFT JOIN services s ON c.id = s.customer_id
            {$whereClause}
            GROUP BY c.id
            ORDER BY c.{$search['sortBy']} {$search['sortOrder']}
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";

        $customers = $db->prepare($query);
        $customers->execute($params);
        $customers = $customers->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $countQuery = "
            SELECT COUNT(DISTINCT c.id) as total
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
        Request::validateRequired($data, ['name', 'phone', 'email']);

        $stmt = $db->prepare("
            INSERT INTO customers (name, phone, email, address)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['name'],
            $data['phone'],
            $data['email'],
            $data['address'] ?? null
        ]);

        Response::success(['id' => $db->lastInsertId()], 'Customer created successfully', 201);

    } elseif ($method === 'PUT') {
        // Update customer
        $customerId = Request::segment(3);
        if (!$customerId) {
            Response::error('Customer ID is required', 400);
        }

        $data = Request::body();
        Request::validateRequired($data, ['name', 'phone', 'email']);

        $stmt = $db->prepare("
            UPDATE customers
            SET name = ?, phone = ?, email = ?, address = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $data['name'],
            $data['phone'],
            $data['email'],
            $data['address'] ?? null,
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
