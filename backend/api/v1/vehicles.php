<?php
/**
 * Vehicles API v1
 * GTV Motor PHP Backend - Complete Vehicle Information
 * Endpoint: api.gtvmotor.dev/v1/vehicles
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
        // Get URI segments
        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        $segments = array_filter($segments);
        $segments = array_values($segments);

        $vehicleId = null;
        if (isset($segments[2]) && is_numeric($segments[2])) {
            $vehicleId = $segments[2];
        }

        // Check if requesting by plate number
        $plateNumber = Request::query('plate_number');

        if ($plateNumber) {
            $vehicleId = null; // Reset vehicleId to use plate number search
        }

        if ($vehicleId && is_numeric($vehicleId)) {
            // Get individual vehicle with complete information
            $stmt = $db->prepare("
                SELECT
                    v.id,
                    v.customer_id,
                    v.plate_number,
                    v.vin_number,
                    v.year,
                    v.current_km,
                    v.purchase_date,
                    v.warranty_start_date,
                    v.warranty_end_date,
                    v.warranty_km_limit,
                    v.warranty_service_count,
                    v.warranty_max_services,
                    v.created_at,
                    v.updated_at,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    c.email as customer_email,
                    c.address as customer_address,
                    vm.id as vehicle_model_id,
                    vm.name as vehicle_model_name,
                    vm.category as vehicle_model_category,
                    vm.base_price as vehicle_model_base_price,
                    vm.description as vehicle_model_description,
                    vm.cc_displacement,
                    vm.engine_type,
                    vm.fuel_type,
                    vm.transmission,
                    vm.warranty_km_limit as model_warranty_km_limit,
                    vm.warranty_max_services as model_warranty_max_services,
                    COUNT(DISTINCT s.id) as service_count,
                    MAX(s.service_date) as last_service_date,
                    MIN(s.service_date) as first_service_date,
                    SUM(s.total_amount) as total_service_amount,
                    SUM(CASE WHEN s.service_status = 'completed' THEN 1 ELSE 0 END) as completed_services,
                    SUM(CASE WHEN s.service_status = 'pending' THEN 1 ELSE 0 END) as pending_services,
                    SUM(CASE WHEN s.service_status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_services
                FROM vehicles v
                LEFT JOIN customers c ON v.customer_id = c.id
                LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                LEFT JOIN services s ON v.id = s.vehicle_id
                WHERE v.id = ?
                GROUP BY v.id
            ");
            $stmt->execute([$vehicleId]);
            $vehicle = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$vehicle) {
                Response::notFound('Vehicle not found');
            }

            // Get all services for this vehicle
            $stmt = $db->prepare("
                SELECT
                    s.id,
                    s.invoice_number,
                    s.service_date,
                    s.current_km,
                    s.next_service_km,
                    s.next_service_date,
                    s.total_amount,
                    s.payment_method,
                    s.payment_status,
                    s.service_status,
                    s.notes,
                    s.exchange_rate,
                    s.total_khr,
                    st.service_type_name,
                    tech.name as technician_name,
                    sales.name as sales_rep_name
                FROM services s
                LEFT JOIN service_types st ON s.service_type_id = st.id
                LEFT JOIN staff tech ON s.technician_id = tech.id
                LEFT JOIN staff sales ON s.sales_rep_id = sales.id
                WHERE s.vehicle_id = ?
                ORDER BY s.service_date DESC, s.id DESC
            ");
            $stmt->execute([$vehicleId]);
            $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Add service items to each service
            foreach ($services as &$service) {
                $itemsStmt = $db->prepare("
                    SELECT
                        si.id,
                        si.description,
                        si.quantity,
                        si.unit_price,
                        si.total_price,
                        si.item_type
                    FROM service_items si
                    WHERE si.service_id = ?
                    ORDER BY si.id
                ");
                $itemsStmt->execute([$service['id']]);
                $service['service_items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
            }

            // Get warranty information if exists
            $stmt = $db->prepare("
                SELECT
                    w.id,
                    w.warranty_type,
                    w.start_date,
                    w.end_date,
                    w.km_limit,
                    w.service_count,
                    w.max_services,
                    w.cost_covered
                FROM warranties w
                WHERE w.vehicle_id = ?
                ORDER BY w.start_date DESC
                LIMIT 1
            ");
            $stmt->execute([$vehicleId]);
            $warranty = $stmt->fetch(PDO::FETCH_ASSOC);

            // Combine all data
            $vehicle['services'] = $services;
            $vehicle['warranty'] = $warranty;

            Response::success($vehicle, 'Vehicle information retrieved successfully');
            return;
        }

        if ($plateNumber) {
            // Get vehicle by plate number
            $stmt = $db->prepare("
                SELECT
                    v.id,
                    v.customer_id,
                    v.plate_number,
                    v.vin_number,
                    v.year,
                    v.current_km,
                    v.purchase_date,
                    v.warranty_start_date,
                    v.warranty_end_date,
                    v.warranty_km_limit,
                    v.warranty_service_count,
                    v.warranty_max_services,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    c.email as customer_email,
                    c.address as customer_address,
                    vm.name as vehicle_model_name,
                    vm.category as vehicle_model_category
                FROM vehicles v
                LEFT JOIN customers c ON v.customer_id = c.id
                LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                WHERE v.plate_number = ?
                ORDER BY v.id DESC
                LIMIT 1
            ");
            $stmt->execute([$plateNumber]);
            $vehicle = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$vehicle) {
                Response::notFound('Vehicle not found');
            }

            Response::success($vehicle, 'Vehicle retrieved successfully');
            return;
        }

        // Get vehicles list with pagination
        $pagination = Request::getPagination();
        $search = Request::getSearch();
        $customerId = Request::query('customer_id');

        $where = [];
        $params = [];

        if (!empty($search['search'])) {
            $where[] = "(v.plate_number LIKE ? OR v.vin_number LIKE ? OR c.name LIKE ? OR vm.name LIKE ?)";
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
                v.id,
                v.customer_id,
                v.plate_number,
                v.vin_number,
                v.year,
                v.current_km,
                v.purchase_date,
                c.name as customer_name,
                c.phone as customer_phone,
                vm.name as vehicle_model_name,
                vm.category as vehicle_model_category,
                COUNT(DISTINCT s.id) as service_count,
                MAX(s.service_date) as last_service_date
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            LEFT JOIN services s ON v.id = s.vehicle_id
            {$whereClause}
            GROUP BY v.id
            ORDER BY v.{$search['sortBy']} {$search['sortOrder']}
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $vehicles = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
        // Check write permission
        if (!ApiAuth::hasPermission($keyConfig, 'write')) {
            Response::forbidden('API key does not have write permission.');
        }

        $data = Request::body();

        // Validate required fields
        Request::validateRequired($data, ['customer_id', 'plate_number']);

        $customerId = (int)$data['customer_id'];
        $plateNumber = Request::sanitize($data['plate_number']);

        // Remove timestamp suffix if present
        if (preg_match('/^(.+)_\d+$/', $plateNumber, $matches)) {
            $plateNumber = $matches[1];
        }

        // Validate customer exists
        $stmt = $db->prepare("SELECT id FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        if (!$stmt->fetch()) {
            Response::error('Customer not found', 404);
        }

        // Get vehicle model ID if model name provided
        $vehicleModelId = null;
        if (!empty($data['model'])) {
            $model = Request::sanitize($data['model']);
            $stmt = $db->prepare("SELECT id FROM vehicle_models WHERE name = ?");
            $stmt->execute([$model]);
            $vehicleModel = $stmt->fetch(PDO::FETCH_ASSOC);
            $vehicleModelId = $vehicleModel ? $vehicleModel['id'] : null;
        }

        $vinNumber = !empty($data['vin_number']) ? Request::sanitize($data['vin_number']) : null;
        $year = !empty($data['year']) ? (int)$data['year'] : null;
        $currentKm = !empty($data['current_km']) ? (int)$data['current_km'] : 0;
        $purchaseDate = $data['purchase_date'] ?? null;
        $warrantyStartDate = $data['warranty_start_date'] ?? null;
        $warrantyEndDate = $data['warranty_end_date'] ?? null;
        $warrantyKmLimit = !empty($data['warranty_km_limit']) ? (int)$data['warranty_km_limit'] : 100000;
        $warrantyMaxServices = !empty($data['warranty_max_services']) ? (int)$data['warranty_max_services'] : 10;

        // Insert vehicle
        $stmt = $db->prepare("
            INSERT INTO vehicles (
                customer_id, plate_number, vehicle_model_id, vin_number, year, current_km,
                purchase_date, warranty_start_date, warranty_end_date,
                warranty_km_limit, warranty_max_services, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $customerId, $plateNumber, $vehicleModelId, $vinNumber, $year, $currentKm,
            $purchaseDate, $warrantyStartDate, $warrantyEndDate,
            $warrantyKmLimit, $warrantyMaxServices
        ]);

        $vehicleId = $db->lastInsertId();

        // Get created vehicle with full details
        $stmt = $db->prepare("
            SELECT
                v.*,
                c.name as customer_name,
                c.phone as customer_phone,
                vm.name as vehicle_model_name,
                vm.category as vehicle_model_category
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            WHERE v.id = ?
        ");
        $stmt->execute([$vehicleId]);
        $vehicle = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::created($vehicle, 'Vehicle created successfully');

    } elseif ($method === 'PUT' || $method === 'PATCH') {
        // Update vehicle
        // Check write permission
        if (!ApiAuth::hasPermission($keyConfig, 'write')) {
            Response::forbidden('API key does not have write permission.');
        }

        // Get vehicle ID from URL
        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        $segments = array_filter($segments);
        $segments = array_values($segments);

        $vehicleId = null;
        if (isset($segments[2]) && is_numeric($segments[2])) {
            $vehicleId = $segments[2];
        }

        if (!$vehicleId) {
            Response::error('Vehicle ID is required', 400);
        }

        // Check if vehicle exists
        $stmt = $db->prepare("SELECT id FROM vehicles WHERE id = ?");
        $stmt->execute([$vehicleId]);
        if (!$stmt->fetch()) {
            Response::notFound('Vehicle not found');
        }

        $data = Request::body();

        // Build dynamic UPDATE query
        $updateFields = [];
        $updateValues = [];

        if (isset($data['plate_number'])) {
            $updateFields[] = "plate_number = ?";
            $plateNumber = Request::sanitize($data['plate_number']);
            if (preg_match('/^(.+)_\d+$/', $plateNumber, $matches)) {
                $plateNumber = $matches[1];
            }
            $updateValues[] = $plateNumber;
        }

        if (isset($data['model'])) {
            $model = Request::sanitize($data['model']);
            $stmt = $db->prepare("SELECT id FROM vehicle_models WHERE name = ?");
            $stmt->execute([$model]);
            $vehicleModel = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($vehicleModel) {
                $updateFields[] = "vehicle_model_id = ?";
                $updateValues[] = $vehicleModel['id'];
            }
        }

        if (isset($data['vin_number'])) {
            $updateFields[] = "vin_number = ?";
            $updateValues[] = !empty($data['vin_number']) ? Request::sanitize($data['vin_number']) : null;
        }

        if (isset($data['year'])) {
            $updateFields[] = "year = ?";
            $updateValues[] = !empty($data['year']) ? (int)$data['year'] : null;
        }

        if (isset($data['current_km'])) {
            $updateFields[] = "current_km = ?";
            $updateValues[] = (int)$data['current_km'];
        }

        if (isset($data['purchase_date'])) {
            $updateFields[] = "purchase_date = ?";
            $updateValues[] = $data['purchase_date'] ?? null;
        }

        if (isset($data['warranty_start_date'])) {
            $updateFields[] = "warranty_start_date = ?";
            $updateValues[] = $data['warranty_start_date'] ?? null;
        }

        if (isset($data['warranty_end_date'])) {
            $updateFields[] = "warranty_end_date = ?";
            $updateValues[] = $data['warranty_end_date'] ?? null;
        }

        if (empty($updateFields)) {
            Response::error('No fields to update', 400);
        }

        $updateFields[] = "updated_at = NOW()";
        $updateValues[] = $vehicleId;

        $updateQuery = "UPDATE vehicles SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $db->prepare($updateQuery);
        $stmt->execute($updateValues);

        // Get updated vehicle
        $stmt = $db->prepare("
            SELECT v.*, c.name as customer_name, vm.name as vehicle_model_name
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            WHERE v.id = ?
        ");
        $stmt->execute([$vehicleId]);
        $vehicle = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::success($vehicle, 'Vehicle updated successfully');

    } elseif ($method === 'DELETE') {
        // Delete vehicle
        // Check write permission
        if (!ApiAuth::hasPermission($keyConfig, 'write')) {
            Response::forbidden('API key does not have write permission.');
        }

        // Get vehicle ID from URL
        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        $segments = array_filter($segments);
        $segments = array_values($segments);

        $vehicleId = null;
        if (isset($segments[2]) && is_numeric($segments[2])) {
            $vehicleId = $segments[2];
        }

        if (!$vehicleId) {
            Response::error('Vehicle ID is required', 400);
        }

        // Check if vehicle exists
        $stmt = $db->prepare("SELECT id FROM vehicles WHERE id = ?");
        $stmt->execute([$vehicleId]);
        if (!$stmt->fetch()) {
            Response::notFound('Vehicle not found');
        }

        // Check if vehicle has services
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM services WHERE vehicle_id = ?");
        $stmt->execute([$vehicleId]);
        $serviceCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        if ($serviceCount > 0) {
            Response::error('Cannot delete vehicle with associated services', 409);
        }

        // Delete vehicle
        $stmt = $db->prepare("DELETE FROM vehicles WHERE id = ?");
        $stmt->execute([$vehicleId]);

        Response::noContent('Vehicle deleted successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("API v1 Vehicles error: " . $e->getMessage());
    Response::error('Failed to process request', 500);
}
?>

