<?php
/**
 * Enhanced Services API with Warranty Start Date Management
 * GTV Motor PHP Backend - Service Process with Warranty Tracking
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
        // Get services with warranty information
        $stmt = $db->prepare("
            SELECT 
                s.*,
                v.plate_number,
                v.warranty_start_date,
                v.warranty_end_date,
                v.current_km,
                c.name as customer_name,
                vm.name as model_name,
                st.service_type_name
            FROM services s
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            LEFT JOIN service_types st ON s.service_type_id = st.id
            ORDER BY s.service_date DESC
        ");
        $stmt->execute();
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success($services, 'Services retrieved successfully');

    } elseif ($method === 'POST') {
        // Create new service with warranty start date management
        $data = Request::body();
        Request::validateRequired($data, ['vehicle_id', 'service_date']);

        $vehicleId = (int)$data['vehicle_id'];
        $serviceDate = $data['service_date'];
        $serviceTypeId = isset($data['service_type_id']) ? (int)$data['service_type_id'] : null;
        $currentKmAtService = isset($data['current_km']) ? (int)$data['current_km'] : null;
        $volumeL = isset($data['volume_l']) ? (float)$data['volume_l'] : null;
        $totalAmount = isset($data['total_amount']) ? (float)$data['total_amount'] : 0.00;
        $serviceStatus = Request::sanitize($data['service_status'] ?? 'pending');
        $warrantyUsed = isset($data['warranty_used']) ? (bool)$data['warranty_used'] : false;
        $setWarrantyStartDate = isset($data['set_warranty_start_date']) ? (bool)$data['set_warranty_start_date'] : false;
        $warrantyParts = isset($data['warranty_parts']) ? $data['warranty_parts'] : [];

        // Validate vehicle exists
        $stmt = $db->prepare("SELECT id FROM vehicles WHERE id = ?");
        $stmt->execute([$vehicleId]);
        if (!$stmt->fetch()) {
            Response::error('Vehicle not found', 404);
        }

        // If this is the first service and warranty start date should be set
        if ($setWarrantyStartDate) {
            // Check if this is the first service for this vehicle
            $stmt = $db->prepare("
                SELECT COUNT(*) as service_count 
                FROM services 
                WHERE vehicle_id = ? AND service_status = 'completed'
            ");
            $stmt->execute([$vehicleId]);
            $serviceCount = $stmt->fetch(PDO::FETCH_ASSOC)['service_count'];

            if ($serviceCount == 0) {
                // This is the first completed service, set warranty start date
                $stmt = $db->prepare("
                    UPDATE vehicles 
                    SET 
                        warranty_start_date = ?,
                        warranty_end_date = DATE_ADD(?, INTERVAL (
                            SELECT warranty_engine_years 
                            FROM vehicle_models vm 
                            WHERE vm.id = vehicles.vehicle_model_id
                        ) YEAR),
                        updated_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$serviceDate, $serviceDate, $vehicleId]);

                // Create warranty parts if provided
                if (!empty($warrantyParts)) {
                    foreach ($warrantyParts as $part) {
                        $componentId = (int)$part['warranty_component_id'];
                        $years = (int)$part['warranty_years'];
                        $kilometers = (int)$part['warranty_kilometers'];
                        
                        // Calculate end date based on years
                        $startDateObj = new DateTime($serviceDate);
                        $endDate = $startDateObj->modify("+{$years} years")->format('Y-m-d');
                        
                        // Reset for next iteration
                        $startDateObj = new DateTime($serviceDate);
                        
                        $stmt = $db->prepare("
                            INSERT INTO vehicle_warranty_parts (
                                vehicle_id, warranty_component_id, warranty_years, 
                                warranty_kilometers, start_date, end_date, km_limit, status
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
                        ");
                        
                        $stmt->execute([
                            $vehicleId,
                            $componentId,
                            $years,
                            $kilometers,
                            $serviceDate,
                            $endDate,
                            $kilometers
                        ]);
                    }
                }
            }
        }

        // Update vehicle's current KM if provided
        if ($currentKmAtService) {
            $stmt = $db->prepare("
                UPDATE vehicles 
                SET current_km = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$currentKmAtService, $vehicleId]);
        }

        // Create service record
        $stmt = $db->prepare("
            INSERT INTO services (
                vehicle_id, service_type_id, service_date, current_km, volume_l,
                total_amount, service_status, warranty_used, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");

        $stmt->execute([
            $vehicleId, $serviceTypeId, $serviceDate, $currentKmAtService, $volumeL,
            $totalAmount, $serviceStatus, $warrantyUsed ? 1 : 0
        ]);

        $serviceId = $db->lastInsertId();

        // Get created service with vehicle and warranty info
        $stmt = $db->prepare("
            SELECT 
                s.*,
                v.plate_number,
                v.warranty_start_date,
                v.warranty_end_date,
                v.current_km,
                c.name as customer_name,
                vm.name as model_name,
                st.service_type_name
            FROM services s
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            LEFT JOIN service_types st ON s.service_type_id = st.id
            WHERE s.id = ?
        ");
        $stmt->execute([$serviceId]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::created($service, 'Service created successfully');

    } elseif ($method === 'PUT') {
        // Update service
        $serviceId = Request::segment(2);
        if (!$serviceId || !is_numeric($serviceId)) {
            Response::error('Service ID is required', 400);
        }

        $data = Request::body();
        
        $serviceDate = $data['service_date'] ?? null;
        $serviceTypeId = isset($data['service_type_id']) ? (int)$data['service_type_id'] : null;
        $currentKmAtService = isset($data['current_km']) ? (int)$data['current_km'] : null;
        $volumeL = isset($data['volume_l']) ? (float)$data['volume_l'] : null;
        $totalAmount = isset($data['total_amount']) ? (float)$data['total_amount'] : null;
        $serviceStatus = Request::sanitize($data['service_status'] ?? null);
        $warrantyUsed = isset($data['warranty_used']) ? (bool)$data['warranty_used'] : null;

        // Check if service exists
        $stmt = $db->prepare("SELECT id FROM services WHERE id = ?");
        $stmt->execute([$serviceId]);
        if (!$stmt->fetch()) {
            Response::error('Service not found', 404);
        }

        // Build update query dynamically
        $updateFields = [];
        $params = [];

        if ($serviceDate !== null) {
            $updateFields[] = "service_date = ?";
            $params[] = $serviceDate;
        }
        if ($serviceTypeId !== null) {
            $updateFields[] = "service_type_id = ?";
            $params[] = $serviceTypeId;
        }
        if ($currentKmAtService !== null) {
            $updateFields[] = "current_km = ?";
            $params[] = $currentKmAtService;
        }
        if ($volumeL !== null) {
            $updateFields[] = "volume_l = ?";
            $params[] = $volumeL;
        }
        if ($totalAmount !== null) {
            $updateFields[] = "total_amount = ?";
            $params[] = $totalAmount;
        }
        if ($serviceStatus !== null) {
            $updateFields[] = "service_status = ?";
            $params[] = $serviceStatus;
        }
        if ($warrantyUsed !== null) {
            $updateFields[] = "warranty_used = ?";
            $params[] = $warrantyUsed ? 1 : 0;
        }

        if (empty($updateFields)) {
            Response::error('No fields to update', 400);
        }

        $updateFields[] = "updated_at = NOW()";
        $params[] = $serviceId;

        $stmt = $db->prepare("
            UPDATE services 
            SET " . implode(', ', $updateFields) . "
            WHERE id = ?
        ");
        $stmt->execute($params);

        // Get updated service
        $stmt = $db->prepare("
            SELECT 
                s.*,
                v.plate_number,
                v.warranty_start_date,
                v.warranty_end_date,
                v.current_km,
                c.name as customer_name,
                vm.name as model_name,
                st.service_type_name
            FROM services s
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            LEFT JOIN service_types st ON s.service_type_id = st.id
            WHERE s.id = ?
        ");
        $stmt->execute([$serviceId]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::success($service, 'Service updated successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Enhanced Services API error: " . $e->getMessage());
    Response::error('Failed to process services request', 500);
}
?>
