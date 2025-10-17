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
            // Get individual customer by ID with basic aggregates
            $stmt = $db->prepare("
                SELECT
                    c.id,
                    c.name,
                    c.phone,
                    c.address,
                    c.email,
                    c.created_at,
                    c.updated_at,
                    COUNT(DISTINCT v.id) as vehicle_count,
                    COUNT(DISTINCT s.id) as service_count,
                    COALESCE(SUM(s.total_amount), 0) as total_spent,
                    MAX(s.service_date) as last_service_date,
                    MIN(s.service_date) as first_service_date,
                    SUM(CASE WHEN s.service_status = 'completed' THEN 1 ELSE 0 END) as completed_services,
                    SUM(CASE WHEN s.service_status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_services,
                    SUM(CASE WHEN s.service_status = 'pending' THEN 1 ELSE 0 END) as pending_services
                FROM customers c
                LEFT JOIN vehicles v ON c.id = v.customer_id
                LEFT JOIN services s ON c.id = s.customer_id
                WHERE c.id = ? AND c.id > 0
                GROUP BY c.id
            ");
            $stmt->execute([$customerId]);
            $customer = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$customer) {
                Response::error('Customer not found', 404);
            }

            // Get latest vehicle info separately to avoid complex subqueries
            $stmt = $db->prepare("
                SELECT v.plate_number, vm.name as model_name, vm.category as model_category
                FROM vehicles v
                LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                WHERE v.customer_id = ?
                ORDER BY v.created_at DESC, v.id DESC
                LIMIT 1
            ");
            $stmt->execute([$customerId]);
            $latestVehicle = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($latestVehicle) {
                $customer['latest_vehicle_plate'] = $latestVehicle['plate_number'];
                $customer['latest_vehicle_model_name'] = $latestVehicle['model_name'];
                $customer['latest_vehicle_category'] = $latestVehicle['model_category'];
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

        // Enhanced query - include aggregates and latest vehicle info used by frontend
        $query = "
            SELECT
                c.id,
                c.name,
                c.phone,
                c.address,
                c.email,
                c.created_at,
                c.updated_at,
                COUNT(DISTINCT v.id) as vehicle_count,
                COUNT(DISTINCT s.id) as service_count,
                COALESCE(SUM(s.total_amount), 0) as total_spent,
                MAX(s.service_date) as last_service_date,
                MIN(s.service_date) as first_service_date,
                SUM(CASE WHEN s.service_status = 'completed' THEN 1 ELSE 0 END) as completed_services,
                SUM(CASE WHEN s.service_status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_services,
                SUM(CASE WHEN s.service_status = 'pending' THEN 1 ELSE 0 END) as pending_services
            FROM customers c
            LEFT JOIN vehicles v ON c.id = v.customer_id
            LEFT JOIN services s ON c.id = s.customer_id
            {$whereClause}
            GROUP BY c.id
            ORDER BY {$search['sortBy']} {$search['sortOrder']}
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Add latest vehicle info for each customer
        foreach ($customers as &$customer) {
            $stmt = $db->prepare("
                SELECT v.plate_number, vm.name as model_name, vm.category as model_category
                FROM vehicles v
                LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                WHERE v.customer_id = ?
                ORDER BY v.created_at DESC, v.id DESC
                LIMIT 1
            ");
            $stmt->execute([$customer['id']]);
            $latestVehicle = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($latestVehicle) {
                $customer['latest_vehicle_plate'] = $latestVehicle['plate_number'];
                $customer['latest_vehicle_model_name'] = $latestVehicle['model_name'];
                $customer['latest_vehicle_category'] = $latestVehicle['model_category'];
            }
        }

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