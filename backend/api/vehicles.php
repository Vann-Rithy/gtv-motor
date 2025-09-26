<?php
/**
 * Vehicles API
 * GTV Motor PHP Backend - Updated for Token Authentication
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Request.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    // No authentication required - Developer Mode
    require_once __DIR__ . '/../config/database.php';
    $database = new Database();
    $db = $database->getConnection();

    $method = Request::method();

    if ($method === 'GET') {
        // Check if requesting individual vehicle
        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        $segments = array_filter($segments);
        $segments = array_values($segments);

        $vehicleId = null;
        if (isset($segments[2]) && is_numeric($segments[2])) {
            $vehicleId = $segments[2];
        }

        if ($vehicleId && is_numeric($vehicleId)) {
            // Get individual vehicle by ID
            $stmt = $db->prepare("
                SELECT
                    v.*,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    c.email as customer_email,
                    c.address as customer_address,
                    COUNT(DISTINCT s.id) as service_count,
                    MAX(s.service_date) as last_service_date,
                    SUM(s.total_amount) as total_service_amount,
                    SUM(CASE WHEN s.service_status = 'completed' THEN 1 ELSE 0 END) as completed_services,
                    SUM(CASE WHEN s.service_status = 'pending' THEN 1 ELSE 0 END) as pending_services,
                    SUM(CASE WHEN s.service_status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_services
                FROM vehicles v
                LEFT JOIN customers c ON v.customer_id = c.id
                LEFT JOIN services s ON v.id = s.vehicle_id
                WHERE v.id = ?
                GROUP BY v.id
            ");
            $stmt->execute([$vehicleId]);
            $vehicle = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$vehicle) {
                Response::error('Vehicle not found', 404);
            }

            Response::success($vehicle, 'Vehicle retrieved successfully');
            return;
        }

        // Get vehicles with pagination and search
        $pagination = Request::getPagination();
        $search = Request::getSearch();
        $customerId = Request::query('customer_id');

        $where = [];
        $params = [];

        if (!empty($search['search'])) {
            $where[] = "(v.plate_number LIKE ? OR v.model LIKE ? OR v.vin_number LIKE ? OR c.name LIKE ?)";
            $searchTerm = '%' . $search['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        if ($customerId) {
            $where[] = "v.customer_id = ?";
            $params[] = $customerId;
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $query = "
            SELECT
                v.*,
                c.name as customer_name,
                c.phone as customer_phone,
                c.email as customer_email,
                c.address as customer_address,
                COUNT(DISTINCT s.id) as service_count,
                MAX(s.service_date) as last_service_date,
                SUM(s.total_amount) as total_service_amount,
                SUM(CASE WHEN s.service_status = 'completed' THEN 1 ELSE 0 END) as completed_services,
                SUM(CASE WHEN s.service_status = 'pending' THEN 1 ELSE 0 END) as pending_services
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN services s ON v.id = s.vehicle_id
            {$whereClause}
            GROUP BY v.id
            ORDER BY v.{$search['sortBy']} {$search['sortOrder']}
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";

        $vehicles = $db->prepare($query);
        $vehicles->execute($params);
        $vehicles = $vehicles->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $countQuery = "
            SELECT COUNT(DISTINCT v.id) as total
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
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

        Response::paginated($vehicles, $paginationData, 'Vehicles retrieved successfully');

    } elseif ($method === 'POST') {
        // Create new vehicle
        $data = Request::body();
        Request::validateRequired($data, ['customer_id', 'plate_number', 'model']);

        $customerId = (int)$data['customer_id'];
        $plateNumber = Request::sanitize($data['plate_number']);
        $model = Request::sanitize($data['model']);
        $vinNumber = Request::sanitize($data['vin_number'] ?? '');
        $year = !empty($data['year']) ? (int)$data['year'] : null;
        $currentKm = !empty($data['current_km']) ? (int)$data['current_km'] : 0;
        $purchaseDate = $data['purchase_date'] ?? null;
        $warrantyStartDate = $data['warranty_start_date'] ?? null;
        $warrantyEndDate = $data['warranty_end_date'] ?? null;
        $warrantyKmLimit = !empty($data['warranty_km_limit']) ? (int)$data['warranty_km_limit'] : 100000;
        $warrantyMaxServices = !empty($data['warranty_max_services']) ? (int)$data['warranty_max_services'] : 10;

        // Validate customer exists
        $stmt = $db->prepare("SELECT id FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        if (!$stmt->fetch()) {
            Response::error('Customer not found', 404);
        }

        // Check if plate number already exists
        $stmt = $db->prepare("SELECT id FROM vehicles WHERE plate_number = ?");
        $stmt->execute([$plateNumber]);
        if ($stmt->fetch()) {
            Response::error('Vehicle with this plate number already exists', 409);
        }

        // Check if VIN number already exists (if provided)
        if (!empty($vinNumber)) {
            $stmt = $db->prepare("SELECT id FROM vehicles WHERE vin_number = ?");
            $stmt->execute([$vinNumber]);
            if ($stmt->fetch()) {
                Response::error('Vehicle with this VIN number already exists', 409);
            }
        }

        $stmt = $db->prepare("
            INSERT INTO vehicles (
                customer_id, plate_number, model, vin_number, year, current_km,
                purchase_date, warranty_start_date, warranty_end_date,
                warranty_km_limit, warranty_max_services, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");

        $stmt->execute([
            $customerId, $plateNumber, $model, $vinNumber ?: null, $year, $currentKm,
            $purchaseDate, $warrantyStartDate, $warrantyEndDate,
            $warrantyKmLimit, $warrantyMaxServices
        ]);

        $vehicleId = $db->lastInsertId();

        // Get created vehicle with customer info
        $stmt = $db->prepare("
            SELECT v.*, c.name as customer_name, c.phone as customer_phone
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
            WHERE v.id = ?
        ");
        $stmt->execute([$vehicleId]);
        $vehicle = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::created($vehicle, 'Vehicle created successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Vehicles API error: " . $e->getMessage());
    Response::error('Failed to process vehicles request', 500);
}
?>
