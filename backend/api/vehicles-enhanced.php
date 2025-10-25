<?php
/**
 * Enhanced Vehicles API with Automatic Warranty Assignment
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
                    vm.name as model_name,
                    vm.name as model,
                    vm.category as model_category,
                    vm.base_price as model_base_price,
                    vm.cc_displacement,
                    vm.engine_type,
                    vm.fuel_type,
                    vm.transmission,
                    vm.warranty_engine_years,
                    vm.warranty_engine_km,
                    vm.warranty_paint_years,
                    vm.warranty_paint_km,
                    vm.warranty_transmission_years,
                    vm.warranty_transmission_km,
                    vm.warranty_electrical_years,
                    vm.warranty_electrical_km,
                    vm.warranty_battery_years,
                    vm.warranty_battery_km,
                    vm.has_hybrid_battery,
                    'Unknown' as color,
                    COUNT(DISTINCT s.id) as service_count,
                    MAX(s.service_date) as last_service_date,
                    SUM(s.total_amount) as total_service_amount,
                    SUM(CASE WHEN s.service_status = 'completed' THEN 1 ELSE 0 END) as completed_services,
                    SUM(CASE WHEN s.service_status = 'pending' THEN 1 ELSE 0 END) as pending_services
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

        // Get all vehicles with pagination and search
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? min(100, max(1, (int)$_GET['limit'])) : 20;
        $search = isset($_GET['search']) ? Request::sanitize($_GET['search']) : '';
        $sortBy = isset($_GET['sortBy']) ? Request::sanitize($_GET['sortBy']) : 'id';
        $sortOrder = isset($_GET['sortOrder']) && strtoupper($_GET['sortOrder']) === 'DESC' ? 'DESC' : 'ASC';

        $pagination = [
            'page' => $page,
            'limit' => $limit,
            'offset' => ($page - 1) * $limit
        ];

        $whereClause = '';
        $params = [];

        if (!empty($search)) {
            $whereClause = "
                WHERE (
                    v.plate_number LIKE ? OR 
                    v.vin_number LIKE ? OR 
                    c.name LIKE ? OR 
                    vm.name LIKE ? OR
                    v.model LIKE ?
                )
            ";
            $searchParam = "%{$search}%";
            $params = [$searchParam, $searchParam, $searchParam, $searchParam, $searchParam];
        }

        $query = "
            SELECT
                v.*,
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
                vm.warranty_engine_years,
                vm.warranty_engine_km,
                vm.warranty_paint_years,
                vm.warranty_paint_km,
                vm.warranty_transmission_years,
                vm.warranty_transmission_km,
                vm.warranty_electrical_years,
                vm.warranty_electrical_km,
                vm.warranty_battery_years,
                vm.warranty_battery_km,
                vm.has_hybrid_battery,
                'Unknown' as color,
                COUNT(DISTINCT s.id) as service_count,
                MAX(s.service_date) as last_service_date,
                SUM(s.total_amount) as total_service_amount,
                SUM(CASE WHEN s.service_status = 'completed' THEN 1 ELSE 0 END) as completed_services,
                SUM(CASE WHEN s.service_status = 'pending' THEN 1 ELSE 0 END) as pending_services
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            LEFT JOIN services s ON v.id = s.vehicle_id
            {$whereClause}
            GROUP BY v.id
            ORDER BY v.id DESC
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
        // Create new vehicle with automatic warranty assignment
        $data = Request::body();
        Request::validateRequired($data, ['customer_id', 'plate_number']);

        $customerId = (int)$data['customer_id'];
        $plateNumber = Request::sanitize($data['plate_number']);
        $model = Request::sanitize($data['model'] ?? '');
        $vinNumber = Request::sanitize($data['vin_number'] ?? '');
        $year = !empty($data['year']) ? (int)$data['year'] : null;
        $currentKm = !empty($data['current_km']) ? (int)$data['current_km'] : 0;
        $purchaseDate = $data['purchase_date'] ?? date('Y-m-d');
        $warrantyStartDate = $data['warranty_start_date'] ?? null;
        $warrantyEndDate = $data['warranty_end_date'] ?? null;
        $warrantyKmLimit = !empty($data['warranty_km_limit']) ? (int)$data['warranty_km_limit'] : 100000;
        $warrantyMaxServices = !empty($data['warranty_max_services']) ? (int)$data['warranty_max_services'] : 10;
        $autoAssignWarranty = isset($data['auto_assign_warranty']) ? (bool)$data['auto_assign_warranty'] : true;

        // Validate customer exists
        $stmt = $db->prepare("SELECT id FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        if (!$stmt->fetch()) {
            Response::error('Customer not found', 404);
        }

        // Removed duplicate plate number and VIN validation - users can upload same plate/VIN multiple times

        // Get vehicle_model_id from vehicle_models table (if model is provided)
        $vehicleModelId = null;
        $modelWarrantyConfig = null;
        if (!empty($model)) {
            $stmt = $db->prepare("
                SELECT id, warranty_engine_years, warranty_engine_km,
                       warranty_paint_years, warranty_paint_km,
                       warranty_transmission_years, warranty_transmission_km,
                       warranty_electrical_years, warranty_electrical_km,
                       warranty_battery_years, warranty_battery_km,
                       has_hybrid_battery
                FROM vehicle_models WHERE name = ?
            ");
            $stmt->execute([$model]);
            $vehicleModel = $stmt->fetch(PDO::FETCH_ASSOC);
            $vehicleModelId = $vehicleModel ? $vehicleModel['id'] : null;
            $modelWarrantyConfig = $vehicleModel;
        }

        // Auto-assign warranty if enabled and model is found
        if ($autoAssignWarranty && $modelWarrantyConfig) {
            $warrantyStartDate = $purchaseDate;
            $warrantyEndDate = date('Y-m-d', strtotime($purchaseDate . ' +' . $modelWarrantyConfig['warranty_engine_years'] . ' years'));
            $warrantyKmLimit = $modelWarrantyConfig['warranty_engine_km'];
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

        // Auto-assign detailed warranties if enabled and model is found
        $assignedWarranties = [];
        if ($autoAssignWarranty && $modelWarrantyConfig) {
            $assignedWarranties = autoAssignDetailedWarranties($db, $vehicleId, $modelWarrantyConfig, $purchaseDate);
        }

        // Get created vehicle with customer and model info
        $stmt = $db->prepare("
            SELECT v.*, c.name as customer_name, c.phone as customer_phone,
                   vm.name as model_name, vm.name as model, vm.category as model_category, vm.base_price as model_base_price,
                   vm.cc_displacement, vm.engine_type, vm.fuel_type, vm.transmission,
                   vm.warranty_engine_years, vm.warranty_engine_km,
                   vm.warranty_paint_years, vm.warranty_paint_km,
                   vm.warranty_transmission_years, vm.warranty_transmission_km,
                   vm.warranty_electrical_years, vm.warranty_electrical_km,
                   vm.warranty_battery_years, vm.warranty_battery_km,
                   vm.has_hybrid_battery,
                   'Unknown' as color
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            WHERE v.id = ?
        ");
        $stmt->execute([$vehicleId]);
        $vehicle = $stmt->fetch(PDO::FETCH_ASSOC);

        // Add warranty information to response
        $vehicle['assigned_warranties'] = $assignedWarranties;

        Response::created($vehicle, 'Vehicle created successfully with automatic warranty assignment');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Enhanced Vehicles API error: " . $e->getMessage());
    Response::error('Failed to process vehicles request', 500);
}

/**
 * Automatically assign detailed warranties based on vehicle model configuration
 */
function autoAssignDetailedWarranties($db, $vehicleId, $modelConfig, $purchaseDate) {
    $assignedWarranties = [];
    
    // Calculate warranty end dates
    $purchaseDateTime = new DateTime($purchaseDate);
    
    // Engine warranty
    $engineEndDate = clone $purchaseDateTime;
    $engineEndDate->add(new DateInterval('P' . $modelConfig['warranty_engine_years'] . 'Y'));
    
    // Paint warranty
    $paintEndDate = clone $purchaseDateTime;
    $paintEndDate->add(new DateInterval('P' . $modelConfig['warranty_paint_years'] . 'Y'));
    
    // Transmission warranty
    $transmissionEndDate = clone $purchaseDateTime;
    $transmissionEndDate->add(new DateInterval('P' . $modelConfig['warranty_transmission_years'] . 'Y'));
    
    // Electrical warranty
    $electricalEndDate = clone $purchaseDateTime;
    $electricalEndDate->add(new DateInterval('P' . $modelConfig['warranty_electrical_years'] . 'Y'));
    
    // Battery warranty (if applicable)
    $batteryEndDate = null;
    if ($modelConfig['has_hybrid_battery'] && $modelConfig['warranty_battery_years']) {
        $batteryEndDate = clone $purchaseDateTime;
        $batteryEndDate->add(new DateInterval('P' . $modelConfig['warranty_battery_years'] . 'Y'));
    }

    // Create warranty records for each component
    $warrantyComponents = [
        ['Engine', $modelConfig['warranty_engine_years'], $modelConfig['warranty_engine_km'], $engineEndDate->format('Y-m-d')],
        ['Car Paint', $modelConfig['warranty_paint_years'], $modelConfig['warranty_paint_km'], $paintEndDate->format('Y-m-d')],
        ['Transmission (gearbox)', $modelConfig['warranty_transmission_years'], $modelConfig['warranty_transmission_km'], $transmissionEndDate->format('Y-m-d')],
        ['Electrical System', $modelConfig['warranty_electrical_years'], $modelConfig['warranty_electrical_km'], $electricalEndDate->format('Y-m-d')]
    ];

    if ($modelConfig['has_hybrid_battery'] && $batteryEndDate) {
        $warrantyComponents[] = ['Battery Hybrid', $modelConfig['warranty_battery_years'], $modelConfig['warranty_battery_km'], $batteryEndDate->format('Y-m-d')];
    }

    foreach ($warrantyComponents as $component) {
        $componentName = $component[0];
        $years = $component[1];
        $kilometers = $component[2];
        $endDate = $component[3];

        // Get component ID
        $stmt = $db->prepare("SELECT id FROM warranty_components WHERE name = ?");
        $stmt->execute([$componentName]);
        $componentId = $stmt->fetchColumn();

        if ($componentId) {
            // Create warranty record
            $stmt = $db->prepare("
                INSERT INTO warranties (
                    vehicle_id, warranty_type, start_date, end_date, 
                    km_limit, max_services, terms_conditions, status,
                    warranty_start_date, warranty_end_date, warranty_cost_covered
                ) VALUES (?, 'standard', ?, ?, ?, 2, ?, 'active', ?, ?, 0.00)
            ");
            
            $termsConditions = "Component: {$componentName}, Duration: {$years} years / " . number_format($kilometers) . " km";
            
            $stmt->execute([
                $vehicleId, $purchaseDate, $endDate, $kilometers, 
                $termsConditions, $purchaseDate, $endDate
            ]);

            $assignedWarranties[] = [
                'component' => $componentName,
                'years' => $years,
                'kilometers' => $kilometers,
                'end_date' => $endDate,
                'display_text' => "{$years} Years / " . number_format($kilometers) . " km"
            ];
        }
    }

    return $assignedWarranties;
}
?>
