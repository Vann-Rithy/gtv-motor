<?php
/**
 * Warranties API - Ultra Simple Version
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
        // Check if requesting individual warranty
        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        $segments = array_filter($segments);
        $segments = array_values($segments);

        $warrantyId = null;
        if (isset($segments[2]) && is_numeric($segments[2])) {
            $warrantyId = $segments[2];
        }

        if ($warrantyId && is_numeric($warrantyId)) {
            // Get warranty data from vehicle_warranty_parts table using vehicle_id
            // The warrantyId is actually the vehicle_id now
            $vehicleId = $warrantyId;
            
            // Check if vehicle_warranty_parts table exists
            $tableCheck = $db->query("SHOW TABLES LIKE 'vehicle_warranty_parts'");
            if ($tableCheck->rowCount() === 0) {
                Response::error('Warranty parts table not available', 404);
                exit;
            }
            
            // Get all warranty parts for this vehicle
            $stmt = $db->prepare("
                SELECT 
                    vwp.id as warranty_part_id,
                    vwp.vehicle_id,
                    vwp.warranty_component_id,
                    vwp.warranty_years,
                    vwp.warranty_kilometers,
                    vwp.start_date,
                    vwp.end_date,
                    vwp.km_limit,
                    vwp.status,
                    vwp.created_at,
                    vwp.updated_at,
                    v.plate_number as vehicle_plate,
                    v.vin_number as vehicle_vin,
                    v.year as vehicle_year,
                    v.current_km,
                    c.id as customer_id,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    c.email as customer_email,
                    c.address as customer_address,
                    vm.name as vehicle_model,
                    vm.category as vehicle_category,
                    COALESCE(wc.name, 'Unknown Component') as component_name,
                    wc.description as component_description,
                    COALESCE(wc.category, 'General') as component_category
                FROM vehicle_warranty_parts vwp
                LEFT JOIN vehicles v ON vwp.vehicle_id = v.id
                LEFT JOIN customers c ON v.customer_id = c.id
                LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                LEFT JOIN warranty_components wc ON vwp.warranty_component_id = wc.id
                WHERE vwp.vehicle_id = ?
                ORDER BY vwp.created_at DESC
            ");
            $stmt->execute([$vehicleId]);
            $warrantyPartsData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($warrantyPartsData)) {
                Response::error('Warranty not found for this vehicle', 404);
                exit;
            }
            
            // Build warranty object from warranty parts data
            $firstPart = $warrantyPartsData[0];
            $warranty = [
                'id' => $vehicleId, // Use vehicle_id as warranty ID
                'vehicle_id' => $vehicleId,
                'customer_id' => $firstPart['customer_id'],
                'customer_name' => $firstPart['customer_name'],
                'customer_phone' => $firstPart['customer_phone'],
                'customer_email' => $firstPart['customer_email'],
                'customer_address' => $firstPart['customer_address'],
                'vehicle_plate' => $firstPart['vehicle_plate'],
                'vehicle_vin' => $firstPart['vehicle_vin'],
                'vehicle_year' => $firstPart['vehicle_year'],
                'current_km' => $firstPart['current_km'],
                'vehicle_model' => $firstPart['vehicle_model'],
                'vehicle_category' => $firstPart['vehicle_category'],
                'warranty_type' => 'standard',
                'status' => 'active',
                'start_date' => null,
                'end_date' => null,
                'km_limit' => 0,
                'max_services' => 0,
                'services_used' => 0,
                'total_services_amount' => 0,
                'last_service_date' => null,
                'warranty_parts' => []
            ];
            
            // Add warranty parts and calculate overall dates
            foreach ($warrantyPartsData as $part) {
                $warranty['warranty_parts'][] = [
                    'id' => $part['warranty_part_id'],
                    'vehicle_id' => $part['vehicle_id'],
                    'warranty_component_id' => $part['warranty_component_id'],
                    'warranty_years' => $part['warranty_years'],
                    'warranty_kilometers' => $part['warranty_kilometers'],
                    'start_date' => $part['start_date'],
                    'end_date' => $part['end_date'],
                    'km_limit' => $part['km_limit'],
                    'status' => $part['status'],
                    'component_name' => $part['component_name'],
                    'component_description' => $part['component_description'],
                    'component_category' => $part['component_category'],
                    'created_at' => $part['created_at'],
                    'updated_at' => $part['updated_at']
                ];
                
                // Calculate overall warranty period from parts
                if ($warranty['start_date'] === null || $part['start_date'] < $warranty['start_date']) {
                    $warranty['start_date'] = $part['start_date'];
                }
                if ($warranty['end_date'] === null || $part['end_date'] > $warranty['end_date']) {
                    $warranty['end_date'] = $part['end_date'];
                }
                if ($part['km_limit'] > $warranty['km_limit']) {
                    $warranty['km_limit'] = $part['km_limit'];
                }
            }
            
            $warranty['max_services'] = count($warrantyPartsData) * 2; // Default calculation

            // Check warranty status based on end_date
            if ($warranty['end_date']) {
                $currentDate = date('Y-m-d');
                if ($warranty['end_date'] < $currentDate) {
                    $warranty['status'] = 'expired';
                }
            }

            // Warranty data is already built from vehicle_warranty_parts

            // Get services for this vehicle
            try {
                $stmt = $db->prepare("
                    SELECT 
                        s.id,
                        s.service_date,
                        s.total_amount,
                        s.service_status,
                        s.current_km_at_service,
                        s.warranty_used,
                        s.cost_covered,
                        st.service_type_name
                    FROM services s
                    LEFT JOIN service_types st ON s.service_type_id = st.id
                    WHERE s.vehicle_id = ? AND s.warranty_used = 1
                    ORDER BY s.service_date DESC
                ");
                $stmt->execute([$vehicleId]);
                $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $warranty['services'] = $services ?: [];
                $warranty['services_used'] = count($services);
                $warranty['total_services_amount'] = array_sum(array_column($services, 'total_amount'));
                
                // Get last service date
                if (!empty($services)) {
                    $warranty['last_service_date'] = $services[0]['service_date'];
                }
            } catch (Exception $e) {
                $warranty['services'] = [];
                $warranty['services_used'] = 0;
                $warranty['total_services_amount'] = 0;
                $warranty['last_service_date'] = null;
                error_log("Error fetching services: " . $e->getMessage());
            }

            // Get claims for this vehicle (using vehicle_id since we don't have warranty_id in vehicle_warranty_parts)
            try {
                // Claims are linked to warranties table, so we'll need to check if there's a warranty record
                // For now, return empty array since we're using vehicle_warranty_parts as primary
                $warranty['claims'] = [];
            } catch (Exception $e) {
                $warranty['claims'] = [];
                error_log("Error fetching claims: " . $e->getMessage());
            }

            Response::success($warranty, 'Warranty retrieved successfully');
            return;
        }

        // Get warranty data from vehicle_warranty_parts table as primary source
        $pagination = Request::getPagination();

        $limit = isset($pagination['limit']) && $pagination['limit'] > 0 ? (int)$pagination['limit'] : 100;
        $offset = isset($pagination['offset']) && $pagination['offset'] >= 0 ? (int)$pagination['offset'] : 0;
        
        // Get filter parameters
        $statusFilter = Request::query('status') ?? 'all';
        $searchTerm = Request::query('search') ?? '';
        
        // Check if vehicle_warranty_parts table exists
        $tableCheck = $db->query("SHOW TABLES LIKE 'vehicle_warranty_parts'");
        if ($tableCheck->rowCount() === 0) {
            Response::success([], 'Warranty parts table not available');
            exit;
        }
        
        // Build WHERE conditions
        $conditions = [];
        $params = [];
        
        // Status filter
        if ($statusFilter && $statusFilter !== 'all') {
            // For calculated statuses like 'expiring_soon', we'll handle it in the application logic
            // For now, handle basic status filters
            if (in_array($statusFilter, ['active', 'expired', 'suspended', 'cancelled'])) {
                $conditions[] = "vwp.status = ?";
                $params[] = $statusFilter;
            }
        }
        
        // Search filter
        if ($searchTerm && trim($searchTerm) !== '') {
            $conditions[] = "(c.name LIKE ? OR c.phone LIKE ? OR v.plate_number LIKE ? OR vm.name LIKE ?)";
            $searchPattern = '%' . $searchTerm . '%';
            $params[] = $searchPattern;
            $params[] = $searchPattern;
            $params[] = $searchPattern;
            $params[] = $searchPattern;
        }
        
        $whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';
        
        // Query vehicle_warranty_parts as primary table, join with vehicles, customers, and components
        $query = "
            SELECT 
                vwp.id as warranty_part_id,
                vwp.vehicle_id,
                vwp.warranty_component_id,
                vwp.warranty_years,
                vwp.warranty_kilometers,
                vwp.start_date,
                vwp.end_date,
                vwp.km_limit,
                vwp.status,
                vwp.created_at,
                vwp.updated_at,
                v.plate_number as vehicle_plate,
                v.vin_number as vehicle_vin,
                v.year as vehicle_year,
                v.current_km,
                c.id as customer_id,
                c.name as customer_name,
                c.phone as customer_phone,
                c.email as customer_email,
                c.address as customer_address,
                vm.name as vehicle_model,
                vm.category as vehicle_category,
                COALESCE(wc.name, 'Unknown Component') as component_name,
                wc.description as component_description,
                COALESCE(wc.category, 'General') as component_category
            FROM vehicle_warranty_parts vwp
            LEFT JOIN vehicles v ON vwp.vehicle_id = v.id
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            LEFT JOIN warranty_components wc ON vwp.warranty_component_id = wc.id
            {$whereClause}
            ORDER BY vwp.created_at DESC
            LIMIT {$limit} OFFSET {$offset}
        ";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $warrantyPartsData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Group warranty parts by vehicle to create warranty records
        $warrantiesByVehicle = [];
        foreach ($warrantyPartsData as $part) {
            $vehicleId = $part['vehicle_id'];
            
            if (!isset($warrantiesByVehicle[$vehicleId])) {
                // Create a warranty record for this vehicle
                $warrantiesByVehicle[$vehicleId] = [
                    'id' => $vehicleId, // Use vehicle_id as warranty ID
                    'vehicle_id' => $vehicleId,
                    'customer_id' => $part['customer_id'],
                    'customer_name' => $part['customer_name'],
                    'customer_phone' => $part['customer_phone'],
                    'customer_email' => $part['customer_email'],
                    'customer_address' => $part['customer_address'],
                    'vehicle_plate' => $part['vehicle_plate'],
                    'vehicle_vin' => $part['vehicle_vin'],
                    'vehicle_year' => $part['vehicle_year'],
                    'current_km' => $part['current_km'],
                    'vehicle_model' => $part['vehicle_model'],
                    'vehicle_category' => $part['vehicle_category'],
                    'warranty_type' => 'standard', // Default since we don't have this in vehicle_warranty_parts
                    'start_date' => null,
                    'end_date' => null,
                    'km_limit' => 0,
                    'max_services' => 0,
                    'services_used' => 0,
                    'total_services_amount' => 0,
                    'last_service_date' => null,
                    'status' => 'active',
                    'warranty_parts' => []
                ];
            }
            
            // Add this warranty part to the vehicle's warranty
            $warrantiesByVehicle[$vehicleId]['warranty_parts'][] = [
                'id' => $part['warranty_part_id'],
                'vehicle_id' => $part['vehicle_id'],
                'warranty_component_id' => $part['warranty_component_id'],
                'warranty_years' => $part['warranty_years'],
                'warranty_kilometers' => $part['warranty_kilometers'],
                'start_date' => $part['start_date'],
                'end_date' => $part['end_date'],
                'km_limit' => $part['km_limit'],
                'status' => $part['status'],
                'component_name' => $part['component_name'],
                'component_description' => $part['component_description'],
                'component_category' => $part['component_category'],
                'created_at' => $part['created_at'],
                'updated_at' => $part['updated_at']
            ];
            
            // Update warranty start/end dates based on parts
            if ($warrantiesByVehicle[$vehicleId]['start_date'] === null || 
                $part['start_date'] < $warrantiesByVehicle[$vehicleId]['start_date']) {
                $warrantiesByVehicle[$vehicleId]['start_date'] = $part['start_date'];
            }
            if ($warrantiesByVehicle[$vehicleId]['end_date'] === null || 
                $part['end_date'] > $warrantiesByVehicle[$vehicleId]['end_date']) {
                $warrantiesByVehicle[$vehicleId]['end_date'] = $part['end_date'];
            }
            if ($part['km_limit'] > $warrantiesByVehicle[$vehicleId]['km_limit']) {
                $warrantiesByVehicle[$vehicleId]['km_limit'] = $part['km_limit'];
            }
        }
        
        $warranties = array_values($warrantiesByVehicle);

        // Check warranty status based on end_date for each warranty
        $currentDate = date('Y-m-d');
        foreach ($warranties as &$warranty) {
            if ($warranty['end_date'] && $warranty['end_date'] < $currentDate) {
                $warranty['status'] = 'expired';
            }
        }
        unset($warranty);

        // Add service statistics for each warranty (warranty parts already included)
        foreach ($warranties as &$warranty) {
            $vehicleId = $warranty['vehicle_id'] ?? null;
            
            if (!$vehicleId) {
                $warranty['services_used'] = 0;
                $warranty['total_services_amount'] = 0;
                $warranty['last_service_date'] = null;
                continue;
            }
            
            try {
                // Get services used count
                $stmt = $db->prepare("SELECT COUNT(*) as count FROM services WHERE vehicle_id = ? AND warranty_used = 1");
                $stmt->execute([$vehicleId]);
                $servicesUsed = $stmt->fetch(PDO::FETCH_ASSOC);
                $warranty['services_used'] = $servicesUsed['count'] ?? 0;
                
                // Get total services amount
                $stmt = $db->prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM services WHERE vehicle_id = ? AND warranty_used = 1");
                $stmt->execute([$vehicleId]);
                $totalAmount = $stmt->fetch(PDO::FETCH_ASSOC);
                $warranty['total_services_amount'] = $totalAmount['total'] ?? 0;
                
                // Get last service date
                $stmt = $db->prepare("SELECT MAX(service_date) as last_date FROM services WHERE vehicle_id = ? AND warranty_used = 1");
                $stmt->execute([$vehicleId]);
                $lastDate = $stmt->fetch(PDO::FETCH_ASSOC);
                $warranty['last_service_date'] = $lastDate['last_date'] ?? null;
                
                // Calculate max_services from warranty parts count
                $warranty['max_services'] = count($warranty['warranty_parts']) * 2; // Default calculation
            } catch (Exception $e) {
                // If service statistics fail, just set defaults
                $warranty['services_used'] = 0;
                $warranty['total_services_amount'] = 0;
                $warranty['last_service_date'] = null;
                $warranty['max_services'] = 0;
                error_log("Error fetching service statistics: " . $e->getMessage());
            }
        }
        unset($warranty);

        // Get total count with same filters (count distinct vehicles with warranty parts)
        $countQuery = "
            SELECT COUNT(DISTINCT vwp.vehicle_id) as total 
            FROM vehicle_warranty_parts vwp
            LEFT JOIN vehicles v ON vwp.vehicle_id = v.id
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            {$whereClause}
        ";
        $countStmt = $db->prepare($countQuery);
        $countStmt->execute($params);
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Return data in format expected by frontend
        // Frontend expects { success: true, data: warranties }
        Response::success($warranties, 'Warranties retrieved successfully');

    } elseif ($method === 'POST') {
        // Create new warranty
        $data = Request::body();
        Request::validateRequired($data, ['vehicle_id', 'warranty_type']);

        $vehicleId = (int)$data['vehicle_id'];
        $warrantyType = Request::sanitize($data['warranty_type']);
        $startDate = $data['start_date'] ?? date('Y-m-d');
        $endDate = $data['end_date'];
        $kmLimit = isset($data['km_limit']) ? (int)$data['km_limit'] : 15000;
        $maxServices = isset($data['max_services']) ? (int)$data['max_services'] : 2;
        $termsConditions = Request::sanitize($data['terms_conditions'] ?? '');

        // Validate vehicle exists
        $stmt = $db->prepare("SELECT id FROM vehicles WHERE id = ?");
        $stmt->execute([$vehicleId]);
        if (!$stmt->fetch()) {
            Response::error('Vehicle not found', 404);
        }

        $stmt = $db->prepare("
            INSERT INTO warranties (
                vehicle_id, warranty_type, start_date, end_date, km_limit,
                max_services, terms_conditions, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $vehicleId, $warrantyType, $startDate, $endDate, $kmLimit,
            $maxServices, $termsConditions
        ]);

        $warrantyId = $db->lastInsertId();

        // Get the created warranty
        $stmt = $db->prepare("SELECT * FROM warranties WHERE id = ?");
        $stmt->execute([$warrantyId]);
        $warranty = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::created($warranty, 'Warranty created successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Warranties API error: " . $e->getMessage());
    Response::error('Failed to process warranties request', 500);
}
?>