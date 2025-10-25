<?php
/**
 * Enhanced Warranty Status API
 * GTV Motor PHP Backend - Real-time Warranty Status Display
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Request.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    require_once __DIR__ . '/../config/database.php';
    $database = new Database();
    $db = $database->getConnection();

    $method = Request::method();
    $action = Request::segment(2) ?? '';

    if ($method === 'GET') {
        if ($action === 'vehicle') {
            // Get detailed warranty status for a specific vehicle
            $vehicleId = Request::segment(3);
            if (!$vehicleId || !is_numeric($vehicleId)) {
                Response::error('Vehicle ID is required', 400);
            }

            // Get vehicle information with warranty details
            $stmt = $db->prepare("
                SELECT 
                    v.id as vehicle_id,
                    v.plate_number,
                    v.vin_number,
                    v.year,
                    v.purchase_date,
                    v.warranty_start_date,
                    v.warranty_end_date,
                    v.warranty_km_limit,
                    v.warranty_service_count,
                    v.warranty_max_services,
                    v.current_km,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    vm.name as model_name,
                    vm.category as model_category,
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
                    vm.has_hybrid_battery
                FROM vehicles v
                LEFT JOIN customers c ON v.customer_id = c.id
                LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                WHERE v.id = ?
            ");
            $stmt->execute([$vehicleId]);
            $vehicle = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$vehicle) {
                Response::error('Vehicle not found', 404);
            }

            // Calculate warranty status for each component
            $warrantyStatus = calculateWarrantyStatus($vehicle);
            
            // Get service history for warranty tracking
            $stmt = $db->prepare("
                SELECT 
                    s.id,
                    s.service_date,
                    s.total_amount,
                    s.service_status,
                    s.current_km_at_service,
                    s.warranty_used,
                    st.service_type_name
                FROM services s
                LEFT JOIN service_types st ON s.service_type_id = st.id
                WHERE s.vehicle_id = ?
                ORDER BY s.service_date DESC
            ");
            $stmt->execute([$vehicleId]);
            $serviceHistory = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $response = [
                'vehicle_info' => $vehicle,
                'warranty_status' => $warrantyStatus,
                'service_history' => $serviceHistory
            ];

            Response::success($response, 'Vehicle warranty status retrieved successfully');

        } elseif ($action === 'status') {
            // Get warranty status summary for all vehicles
            $stmt = $db->prepare("
                SELECT 
                    v.id,
                    v.plate_number,
                    v.warranty_start_date,
                    v.warranty_end_date,
                    v.current_km,
                    c.name as customer_name,
                    vm.name as model_name,
                    vm.warranty_engine_years,
                    vm.warranty_engine_km,
                    vm.has_hybrid_battery,
                    vm.warranty_battery_years,
                    vm.warranty_battery_km
                FROM vehicles v
                LEFT JOIN customers c ON v.customer_id = c.id
                LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                WHERE v.warranty_start_date IS NOT NULL
                ORDER BY v.warranty_end_date ASC
            ");
            $stmt->execute();
            $vehicles = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $warrantySummary = [];
            foreach ($vehicles as $vehicle) {
                $status = calculateWarrantyStatus($vehicle);
                $warrantySummary[] = [
                    'vehicle_id' => $vehicle['id'],
                    'plate_number' => $vehicle['plate_number'],
                    'customer_name' => $vehicle['customer_name'],
                    'model_name' => $vehicle['model_name'],
                    'warranty_start_date' => $vehicle['warranty_start_date'],
                    'warranty_end_date' => $vehicle['warranty_end_date'],
                    'current_km' => $vehicle['current_km'],
                    'warranty_status' => $status
                ];
            }

            Response::success($warrantySummary, 'Warranty status summary retrieved successfully');

        } else {
            Response::error('Invalid action', 400);
        }

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Warranty Status API error: " . $e->getMessage());
    Response::error('Failed to process warranty status request', 500);
}

/**
 * Calculate warranty status for each component based on start date and current usage
 */
function calculateWarrantyStatus($vehicle) {
    $startDate = $vehicle['warranty_start_date'] ?: $vehicle['purchase_date'];
    $currentKm = $vehicle['current_km'] ?: 0;
    $currentDate = new DateTime();
    $startDateTime = new DateTime($startDate);
    
    // Calculate days since warranty start
    $daysSinceStart = $currentDate->diff($startDateTime)->days;
    
    $warrantyComponents = [
        'Engine' => [
            'years' => $vehicle['warranty_engine_years'],
            'kilometers' => $vehicle['warranty_engine_km'],
            'applicable' => true
        ],
        'Car Paint' => [
            'years' => $vehicle['warranty_paint_years'],
            'kilometers' => $vehicle['warranty_paint_km'],
            'applicable' => true
        ],
        'Transmission (gearbox)' => [
            'years' => $vehicle['warranty_transmission_years'],
            'kilometers' => $vehicle['warranty_transmission_km'],
            'applicable' => true
        ],
        'Electrical System' => [
            'years' => $vehicle['warranty_electrical_years'],
            'kilometers' => $vehicle['warranty_electrical_km'],
            'applicable' => true
        ],
        'Battery Hybrid' => [
            'years' => $vehicle['warranty_battery_years'],
            'kilometers' => $vehicle['warranty_battery_km'],
            'applicable' => $vehicle['has_hybrid_battery']
        ]
    ];
    
    $status = [];
    
    foreach ($warrantyComponents as $component => $config) {
        if (!$config['applicable']) {
            $status[$component] = [
                'component' => $component,
                'status' => 'not_applicable',
                'message' => 'Not applicable for this vehicle',
                'remaining_years' => 0,
                'remaining_km' => 0,
                'expiry_date' => null,
                'is_expired' => false,
                'progress_percentage' => 0
            ];
            continue;
        }
        
        // Calculate expiry date
        $expiryDate = clone $startDateTime;
        $expiryDate->add(new DateInterval('P' . $config['years'] . 'Y'));
        
        // Calculate remaining time
        $remainingDays = max(0, $expiryDate->diff($currentDate)->days);
        $remainingYears = round($remainingDays / 365.25, 1);
        
        // Calculate remaining kilometers
        $remainingKm = max(0, $config['kilometers'] - $currentKm);
        
        // Check if expired
        $isExpired = $currentDate > $expiryDate || $currentKm > $config['kilometers'];
        
        // Calculate progress percentage
        $timeProgress = min(100, ($daysSinceStart / ($config['years'] * 365.25)) * 100);
        $kmProgress = min(100, ($currentKm / $config['kilometers']) * 100);
        $progressPercentage = max($timeProgress, $kmProgress);
        
        // Determine status
        if ($isExpired) {
            $statusText = 'expired';
            $message = 'Warranty has expired';
        } elseif ($remainingDays < 30) {
            $statusText = 'expiring_soon';
            $message = 'Warranty expires soon';
        } elseif ($remainingKm < 10000) {
            $statusText = 'expiring_soon';
            $message = 'Warranty mileage limit approaching';
        } else {
            $statusText = 'active';
            $message = 'Warranty is active';
        }
        
        $status[$component] = [
            'component' => $component,
            'status' => $statusText,
            'message' => $message,
            'remaining_years' => $remainingYears,
            'remaining_km' => $remainingKm,
            'expiry_date' => $expiryDate->format('Y-m-d'),
            'is_expired' => $isExpired,
            'progress_percentage' => round($progressPercentage, 1),
            'original_warranty' => $config['years'] . ' Years / ' . number_format($config['kilometers']) . ' km',
            'remaining_display' => $remainingYears . ' Years / ' . number_format($remainingKm) . ' km'
        ];
    }
    
    return $status;
}
?>
