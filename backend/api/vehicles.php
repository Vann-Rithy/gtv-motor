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
        // Check if requesting vehicle by plate number
        $plateNumber = Request::query('plate_number');
        
        if ($plateNumber) {
            // Get vehicle by plate number with customer info and latest service details
            $stmt = $db->prepare("
                SELECT
                    v.*,
                    v.vehicle_model_id,
                    v.plate_number,
                    v.vin_number,
                    v.year,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    c.email as customer_email,
                    c.address as customer_address,
                    vm.name as model_name,
                    vm.name as model,
                    vm.category as model_category,
                    vm.base_price as model_base_price,
                    vm.cc_displacement,
                    vm.engine_type,
                    vm.fuel_type,
                    vm.transmission,
                    latest_service.technician_id,
                    latest_service.sales_rep_id,
                    tech.name as technician_name,
                    sales.name as sales_rep_name
                FROM vehicles v
                LEFT JOIN customers c ON v.customer_id = c.id
                LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                LEFT JOIN (
                    SELECT s.vehicle_id, s.technician_id, s.sales_rep_id
                    FROM services s
                    INNER JOIN (
                        SELECT vehicle_id, MAX(service_date) as max_date
                        FROM services
                        WHERE vehicle_id = (SELECT id FROM vehicles WHERE plate_number = ? LIMIT 1)
                        GROUP BY vehicle_id
                    ) latest ON s.vehicle_id = latest.vehicle_id AND s.service_date = latest.max_date
                    ORDER BY s.id DESC
                    LIMIT 1
                ) latest_service ON v.id = latest_service.vehicle_id
                LEFT JOIN staff tech ON latest_service.technician_id = tech.id
                LEFT JOIN staff sales ON latest_service.sales_rep_id = sales.id
                WHERE v.plate_number = ?
                ORDER BY v.id DESC
                LIMIT 1
            ");
            $stmt->execute([$plateNumber, $plateNumber]);
            $vehicle = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$vehicle) {
                Response::error('Vehicle not found', 404);
            }

            Response::success($vehicle, 'Vehicle retrieved successfully');
            return;
        }

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
                    v.vehicle_model_id,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    c.email as customer_email,
                    c.address as customer_address,
                    vm.name as model_name,
                    vm.name as model,
                    vm.category as model_category,
                    vm.base_price as model_base_price,
                    vm.cc_displacement,
                    vm.engine_type,
                    vm.fuel_type,
                    vm.transmission,
                    'Unknown' as color,
                    COUNT(DISTINCT s.id) as service_count,
                    MAX(s.service_date) as last_service_date,
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

        // Validate sortBy to prevent SQL injection
        $allowedSortColumns = ['id', 'plate_number', 'created_at', 'updated_at'];
        $sortBy = in_array($search['sortBy'], $allowedSortColumns) ? $search['sortBy'] : 'id';
        $sortOrder = strtoupper($search['sortOrder']) === 'ASC' ? 'ASC' : 'DESC';

        $query = "
            SELECT
                v.*,
                v.vehicle_model_id,
                c.name as customer_name,
                c.phone as customer_phone,
                c.email as customer_email,
                c.address as customer_address,
                vm.name as model_name,
                vm.name as model,
                vm.category as model_category,
                vm.base_price as model_base_price,
                vm.cc_displacement,
                vm.engine_type,
                vm.fuel_type,
                vm.transmission,
                'Unknown' as color,
                COALESCE(COUNT(DISTINCT s.id), 0) as service_count,
                MAX(s.service_date) as last_service_date,
                COALESCE(SUM(s.total_amount), 0) as total_service_amount,
                COALESCE(SUM(CASE WHEN s.service_status = 'completed' THEN 1 ELSE 0 END), 0) as completed_services,
                COALESCE(SUM(CASE WHEN s.service_status = 'pending' THEN 1 ELSE 0 END), 0) as pending_services
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            LEFT JOIN services s ON v.id = s.vehicle_id
            {$whereClause}
            GROUP BY v.id
            ORDER BY v.{$sortBy} {$sortOrder}
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";

        try {
            $vehicles = $db->prepare($query);
            $vehicles->execute($params);
            $vehicles = $vehicles->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Vehicles query error: " . $e->getMessage());
            error_log("Query: " . $query);
            error_log("Params: " . print_r($params, true));
            Response::error('Failed to fetch vehicles: ' . $e->getMessage(), 500);
            return;
        }

        // Get total count
        $countQuery = "
            SELECT COUNT(DISTINCT v.id) as total
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
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
        
        // Debug logging
        error_log("Vehicle creation data: " . json_encode($data));
        
        // Check if data has modified plate numbers with timestamps (from frontend)
        $customerId = 0;
        $plateNumber = '';
        
        if (isset($data['customer_id'])) {
            $customerId = (int)$data['customer_id'];
        }
        
        if (isset($data['plate_number'])) {
            $plateNumber = Request::sanitize($data['plate_number']);
            // Remove timestamp suffix if present (format: plate_timestamp)
            if (preg_match('/^(.+)_\d+$/', $plateNumber, $matches)) {
                $plateNumber = $matches[1];
            }
        }
        
        // Validate required fields after cleaning
        if ($customerId <= 0 || empty($plateNumber)) {
            Response::error('Missing required fields: customer_id, plate_number', 400);
        }
        
        $model = Request::sanitize($data['model'] ?? '');
        $vinNumber = Request::sanitize($data['vin_number'] ?? '');
        
        // Clean VIN number if it has timestamp suffix
        if (!empty($vinNumber) && preg_match('/^(.+)_\d+$/', $vinNumber, $matches)) {
            $vinNumber = $matches[1];
        }
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

        // Removed duplicate plate number and VIN validation - users can upload same plate/VIN multiple times

        // Get vehicle_model_id from vehicle_models table (if model is provided)
        $vehicleModelId = null;
        if (!empty($model)) {
            $stmt = $db->prepare("SELECT id FROM vehicle_models WHERE name = ?");
            $stmt->execute([$model]);
            $vehicleModel = $stmt->fetch(PDO::FETCH_ASSOC);
            $vehicleModelId = $vehicleModel ? $vehicleModel['id'] : null;
        }

        // Try to insert without model column first
        try {
            $stmt = $db->prepare("
                INSERT INTO vehicles (
                    customer_id, plate_number, vehicle_model_id, vin_number, year, current_km,
                    purchase_date, warranty_start_date, warranty_end_date,
                    warranty_km_limit, warranty_max_services, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");

            $stmt->execute([
                $customerId, $plateNumber, $vehicleModelId, $vinNumber ?: null, $year, $currentKm,
                $purchaseDate, $warrantyStartDate, $warrantyEndDate,
                $warrantyKmLimit, $warrantyMaxServices
            ]);
        } catch (Exception $e) {
            // If that fails, try with model column
            $stmt = $db->prepare("
                INSERT INTO vehicles (
                    customer_id, plate_number, model, vehicle_model_id, vin_number, year, current_km,
                    purchase_date, warranty_start_date, warranty_end_date,
                    warranty_km_limit, warranty_max_services, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");

            $stmt->execute([
                $customerId, $plateNumber, $model, $vehicleModelId, $vinNumber ?: null, $year, $currentKm,
                $purchaseDate, $warrantyStartDate, $warrantyEndDate,
                $warrantyKmLimit, $warrantyMaxServices
            ]);
        }

        $vehicleId = $db->lastInsertId();

        // Get created vehicle with customer and model info
        $stmt = $db->prepare("
            SELECT v.*, c.name as customer_name, c.phone as customer_phone,
                   vm.name as model_name, vm.name as model, vm.category as model_category, vm.base_price as model_base_price,
                   vm.cc_displacement, vm.engine_type, vm.fuel_type, vm.transmission,
                   'Unknown' as color
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
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
