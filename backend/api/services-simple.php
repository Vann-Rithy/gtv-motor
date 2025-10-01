<?php
/**
 * Services API - Simplified Version
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
        // Check if requesting individual service
        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        $segments = array_filter($segments);
        $segments = array_values($segments);

        $serviceId = null;
        if (isset($segments[2]) && is_numeric($segments[2])) {
            $serviceId = $segments[2];
        }

        if ($serviceId && is_numeric($serviceId)) {
            // Get individual service by ID
            $stmt = $db->prepare("
                SELECT
                    s.*,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    v.plate_number as vehicle_plate,
                    vm.name as vehicle_model_name,
                    vm.category as vehicle_model_category
                FROM services s
                LEFT JOIN customers c ON s.customer_id = c.id
                LEFT JOIN vehicles v ON s.vehicle_id = v.id
                LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                WHERE s.id = ?
            ");
            $stmt->execute([$serviceId]);
            $service = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$service) {
                Response::error('Service not found', 404);
            }

            Response::success($service, 'Service retrieved successfully');
            return;
        }

        // Get services with pagination and search
        $pagination = Request::getPagination();
        $search = Request::getSearch();
        $customerId = Request::query('customer_id');
        $vehicleId = Request::query('vehicle_id');

        $where = [];
        $params = [];

        if (!empty($search['search'])) {
            $where[] = "(s.service_type LIKE ? OR s.description LIKE ? OR c.name LIKE ? OR v.plate_number LIKE ?)";
            $searchTerm = '%' . $search['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        if ($customerId) {
            $where[] = "s.customer_id = ?";
            $params[] = $customerId;
        }

        if ($vehicleId) {
            $where[] = "s.vehicle_id = ?";
            $params[] = $vehicleId;
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $query = "
            SELECT
                s.*,
                c.name as customer_name,
                c.phone as customer_phone,
                v.plate_number as vehicle_plate,
                vm.name as vehicle_model_name,
                vm.category as vehicle_model_category
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            {$whereClause}
            ORDER BY s.{$search['sortBy']} {$search['sortOrder']}
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $countQuery = "
            SELECT COUNT(*) as total
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
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

        Response::paginated($services, $paginationData, 'Services retrieved successfully');

    } elseif ($method === 'POST') {
        // Create new service
        $data = Request::body();
        Request::validateRequired($data, ['customer_id', 'vehicle_id', 'service_type']);

        $customerId = (int)$data['customer_id'];
        $vehicleId = (int)$data['vehicle_id'];
        $serviceType = Request::sanitize($data['service_type']);
        $description = Request::sanitize($data['description'] ?? '');
        $serviceDate = $data['service_date'] ?? date('Y-m-d');
        $totalAmount = isset($data['total_amount']) ? (float)$data['total_amount'] : 0.00;
        $serviceStatus = Request::sanitize($data['service_status'] ?? 'pending');

        // Validate customer exists
        $stmt = $db->prepare("SELECT id FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        if (!$stmt->fetch()) {
            Response::error('Customer not found', 404);
        }

        // Validate vehicle exists
        $stmt = $db->prepare("SELECT id FROM vehicles WHERE id = ?");
        $stmt->execute([$vehicleId]);
        if (!$stmt->fetch()) {
            Response::error('Vehicle not found', 404);
        }

        $stmt = $db->prepare("
            INSERT INTO services (
                customer_id, vehicle_id, service_type, description, service_date,
                total_amount, service_status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $customerId, $vehicleId, $serviceType, $description, $serviceDate,
            $totalAmount, $serviceStatus
        ]);

        $serviceId = $db->lastInsertId();

        // Get the created service
        $stmt = $db->prepare("
            SELECT s.*, c.name as customer_name, c.phone as customer_phone,
                   v.plate_number as vehicle_plate, vm.name as vehicle_model_name
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            WHERE s.id = ?
        ");
        $stmt->execute([$serviceId]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::created($service, 'Service created successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Services API error: " . $e->getMessage());
    Response::error('Failed to process services request', 500);
}
?>

