<?php
/**
 * Warranty Configuration API
 * GTV Motor PHP Backend - Automated Warranty Management System
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
    $action = Request::segment(2) ?? '';
    
    // Also support query parameter for action
    if (empty($action)) {
        $action = Request::get('action') ?? '';
    }

    if ($method === 'GET') {
        if ($action === 'components') {
            // Get all warranty components
            $stmt = $db->prepare("
                SELECT id, name, description, category, is_active, created_at, updated_at
                FROM warranty_components
                WHERE is_active = 1
                ORDER BY category, name ASC
            ");
            $stmt->execute();
            $components = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::success($components, 'Warranty components retrieved successfully');

        } elseif ($action === 'summary') {
            // Get warranty summary for all models
            $stmt = $db->prepare("
                SELECT * FROM vehicle_warranty_summary
                ORDER BY model_name ASC
            ");
            $stmt->execute();
            $summary = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::success($summary, 'Warranty summary retrieved successfully');

        } elseif ($action === 'model') {
            // Get detailed warranty configuration for a specific model
            $modelId = Request::segment(3);
            if (!$modelId || !is_numeric($modelId)) {
                Response::error('Model ID is required', 400);
            }

            $stmt = $db->prepare("
                SELECT 
                    vm.id, vm.name, vm.description, vm.category,
                    vm.warranty_engine_years, vm.warranty_engine_km,
                    vm.warranty_paint_years, vm.warranty_paint_km,
                    vm.warranty_transmission_years, vm.warranty_transmission_km,
                    vm.warranty_electrical_years, vm.warranty_electrical_km,
                    vm.warranty_battery_years, vm.warranty_battery_km,
                    vm.has_hybrid_battery,
                    vmw.warranty_component_id, wc.name as component_name, wc.category as component_category,
                    vmw.warranty_years, vmw.warranty_kilometers, vmw.is_applicable
                FROM vehicle_models vm
                LEFT JOIN vehicle_model_warranties vmw ON vm.id = vmw.vehicle_model_id
                LEFT JOIN warranty_components wc ON vmw.warranty_component_id = wc.id
                WHERE vm.id = ? AND vm.is_active = 1
                ORDER BY wc.category, wc.name
            ");
            $stmt->execute([$modelId]);
            $modelWarranties = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($modelWarranties)) {
                Response::error('Vehicle model not found', 404);
            }

            // Group warranties by component
            $warranties = [];
            foreach ($modelWarranties as $warranty) {
                if ($warranty['component_name']) {
                    $warranties[] = [
                        'component_id' => $warranty['warranty_component_id'],
                        'component_name' => $warranty['component_name'],
                        'component_category' => $warranty['component_category'],
                        'warranty_years' => $warranty['warranty_years'],
                        'warranty_kilometers' => $warranty['warranty_kilometers'],
                        'is_applicable' => (bool)$warranty['is_applicable'],
                        'display_text' => $warranty['is_applicable'] ? 
                            $warranty['warranty_years'] . ' Years / ' . number_format($warranty['warranty_kilometers']) . ' km' : 
                            'N/A'
                    ];
                }
            }

            $modelInfo = [
                'id' => $modelWarranties[0]['id'],
                'name' => $modelWarranties[0]['name'],
                'description' => $modelWarranties[0]['description'],
                'category' => $modelWarranties[0]['category'],
                'has_hybrid_battery' => (bool)$modelWarranties[0]['has_hybrid_battery'],
                'warranties' => $warranties
            ];

            Response::success($modelInfo, 'Model warranty configuration retrieved successfully');

        } else {
            // Get all warranty configurations
            $stmt = $db->prepare("
                SELECT 
                    vm.id, vm.name, vm.category,
                    vm.warranty_engine_years, vm.warranty_engine_km,
                    vm.warranty_paint_years, vm.warranty_paint_km,
                    vm.warranty_transmission_years, vm.warranty_transmission_km,
                    vm.warranty_electrical_years, vm.warranty_electrical_km,
                    vm.warranty_battery_years, vm.warranty_battery_km,
                    vm.has_hybrid_battery
                FROM vehicle_models vm
                WHERE vm.is_active = 1
                ORDER BY vm.name ASC
            ");
            $stmt->execute();
            $configurations = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::success($configurations, 'Warranty configurations retrieved successfully');
        }

    } elseif ($method === 'POST') {
        if ($action === 'auto-assign') {
            // Automatically assign warranty to a vehicle based on its model
            $data = Request::body();
            Request::validateRequired($data, ['vehicle_id', 'vehicle_model_id']);

            $vehicleId = (int)$data['vehicle_id'];
            $vehicleModelId = (int)$data['vehicle_model_id'];
            $purchaseDate = $data['purchase_date'] ?? date('Y-m-d');

            // Get vehicle model warranty configuration
            $stmt = $db->prepare("
                SELECT 
                    vm.name as model_name,
                    vm.warranty_engine_years, vm.warranty_engine_km,
                    vm.warranty_paint_years, vm.warranty_paint_km,
                    vm.warranty_transmission_years, vm.warranty_transmission_km,
                    vm.warranty_electrical_years, vm.warranty_electrical_km,
                    vm.warranty_battery_years, vm.warranty_battery_km,
                    vm.has_hybrid_battery
                FROM vehicle_models vm
                WHERE vm.id = ? AND vm.is_active = 1
            ");
            $stmt->execute([$vehicleModelId]);
            $modelConfig = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$modelConfig) {
                Response::error('Vehicle model not found', 404);
            }

            // Check if vehicle exists
            $stmt = $db->prepare("SELECT id FROM vehicles WHERE id = ?");
            $stmt->execute([$vehicleId]);
            if (!$stmt->fetch()) {
                Response::error('Vehicle not found', 404);
            }

            // Calculate warranty end dates
            $purchaseDateTime = new DateTime($purchaseDate);
            $engineEndDate = $purchaseDateTime->add(new DateInterval('P' . $modelConfig['warranty_engine_years'] . 'Y'))->format('Y-m-d');
            $paintEndDate = $purchaseDateTime->add(new DateInterval('P' . $modelConfig['warranty_paint_years'] . 'Y'))->format('Y-m-d');
            $transmissionEndDate = $purchaseDateTime->add(new DateInterval('P' . $modelConfig['warranty_transmission_years'] . 'Y'))->format('Y-m-d');
            $electricalEndDate = $purchaseDateTime->add(new DateInterval('P' . $modelConfig['warranty_electrical_years'] . 'Y'))->format('Y-m-d');
            
            $batteryEndDate = null;
            if ($modelConfig['has_hybrid_battery'] && $modelConfig['warranty_battery_years']) {
                $batteryEndDate = $purchaseDateTime->add(new DateInterval('P' . $modelConfig['warranty_battery_years'] . 'Y'))->format('Y-m-d');
            }

            // Update vehicle warranty information
            $stmt = $db->prepare("
                UPDATE vehicles 
                SET 
                    warranty_start_date = ?,
                    warranty_end_date = ?,
                    warranty_km_limit = ?,
                    warranty_max_services = 2,
                    updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([
                $purchaseDate,
                $engineEndDate, // Use engine warranty as primary
                $modelConfig['warranty_engine_km'],
                $vehicleId
            ]);

            // Create detailed warranty records for each component
            $warrantyComponents = [
                ['Engine', $modelConfig['warranty_engine_years'], $modelConfig['warranty_engine_km'], $engineEndDate],
                ['Car Paint', $modelConfig['warranty_paint_years'], $modelConfig['warranty_paint_km'], $paintEndDate],
                ['Transmission (gearbox)', $modelConfig['warranty_transmission_years'], $modelConfig['warranty_transmission_km'], $transmissionEndDate],
                ['Electrical System', $modelConfig['warranty_electrical_years'], $modelConfig['warranty_electrical_km'], $electricalEndDate]
            ];

            if ($modelConfig['has_hybrid_battery'] && $batteryEndDate) {
                $warrantyComponents[] = ['Battery Hybrid', $modelConfig['warranty_battery_years'], $modelConfig['warranty_battery_km'], $batteryEndDate];
            }

            $assignedWarranties = [];
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
                    
                    $termsConditions = "Component: {$componentName}, Model: {$modelConfig['model_name']}, Duration: {$years} years / " . number_format($kilometers) . " km";
                    
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

            Response::success([
                'vehicle_id' => $vehicleId,
                'model_name' => $modelConfig['model_name'],
                'purchase_date' => $purchaseDate,
                'assigned_warranties' => $assignedWarranties
            ], 'Warranty automatically assigned successfully');

        } elseif ($action === 'update-model') {
            // Update warranty configuration for a specific model
            $modelId = Request::segment(3);
            if (!$modelId || !is_numeric($modelId)) {
                Response::error('Model ID is required', 400);
            }

            $data = Request::body();
            
            // Validate required fields
            $requiredFields = [
                'warranty_engine_years', 'warranty_engine_km',
                'warranty_paint_years', 'warranty_paint_km',
                'warranty_transmission_years', 'warranty_transmission_km',
                'warranty_electrical_years', 'warranty_electrical_km'
            ];
            
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
                    Response::error("Field {$field} is required", 400);
                }
            }

            // Check if model exists
            $stmt = $db->prepare("SELECT id FROM vehicle_models WHERE id = ?");
            $stmt->execute([$modelId]);
            if (!$stmt->fetch()) {
                Response::error('Vehicle model not found', 404);
            }

            // Update vehicle model warranty configuration
            $stmt = $db->prepare("
                UPDATE vehicle_models 
                SET 
                    warranty_engine_years = ?, warranty_engine_km = ?,
                    warranty_paint_years = ?, warranty_paint_km = ?,
                    warranty_transmission_years = ?, warranty_transmission_km = ?,
                    warranty_electrical_years = ?, warranty_electrical_km = ?,
                    warranty_battery_years = ?, warranty_battery_km = ?,
                    has_hybrid_battery = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([
                (int)$data['warranty_engine_years'], (int)$data['warranty_engine_km'],
                (int)$data['warranty_paint_years'], (int)$data['warranty_paint_km'],
                (int)$data['warranty_transmission_years'], (int)$data['warranty_transmission_km'],
                (int)$data['warranty_electrical_years'], (int)$data['warranty_electrical_km'],
                isset($data['warranty_battery_years']) ? (int)$data['warranty_battery_years'] : null,
                isset($data['warranty_battery_km']) ? (int)$data['warranty_battery_km'] : null,
                isset($data['has_hybrid_battery']) ? (int)$data['has_hybrid_battery'] : 0,
                $modelId
            ]);

            // Update vehicle_model_warranties table
            $stmt = $db->prepare("
                UPDATE vehicle_model_warranties vmw
                JOIN warranty_components wc ON vmw.warranty_component_id = wc.id
                SET 
                    vmw.warranty_years = CASE 
                        WHEN wc.name = 'Engine' THEN ?
                        WHEN wc.name = 'Car Paint' THEN ?
                        WHEN wc.name = 'Transmission (gearbox)' THEN ?
                        WHEN wc.name = 'Electrical System' THEN ?
                        WHEN wc.name = 'Battery Hybrid' THEN ?
                    END,
                    vmw.warranty_kilometers = CASE 
                        WHEN wc.name = 'Engine' THEN ?
                        WHEN wc.name = 'Car Paint' THEN ?
                        WHEN wc.name = 'Transmission (gearbox)' THEN ?
                        WHEN wc.name = 'Electrical System' THEN ?
                        WHEN wc.name = 'Battery Hybrid' THEN ?
                    END,
                    vmw.is_applicable = CASE 
                        WHEN wc.name = 'Battery Hybrid' THEN ?
                        ELSE 1
                    END,
                    vmw.updated_at = NOW()
                WHERE vmw.vehicle_model_id = ?
            ");
            $stmt->execute([
                (int)$data['warranty_engine_years'], (int)$data['warranty_paint_years'],
                (int)$data['warranty_transmission_years'], (int)$data['warranty_electrical_years'],
                isset($data['warranty_battery_years']) ? (int)$data['warranty_battery_years'] : 0,
                (int)$data['warranty_engine_km'], (int)$data['warranty_paint_km'],
                (int)$data['warranty_transmission_km'], (int)$data['warranty_electrical_km'],
                isset($data['warranty_battery_km']) ? (int)$data['warranty_battery_km'] : 0,
                isset($data['has_hybrid_battery']) ? (int)$data['has_hybrid_battery'] : 0,
                $modelId
            ]);

            Response::success(null, 'Model warranty configuration updated successfully');

        } else {
            Response::error('Invalid action', 400);
        }

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Warranty Configuration API error: " . $e->getMessage());
    Response::error('Failed to process warranty configuration request', 500);
}
?>
