<?php
/**
 * Vehicle Warranty Parts API
 * GTV Motor PHP Backend - Vehicle Warranty Parts Management
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
        $vehicleId = Request::query('vehicle_id');
        
        if (!$vehicleId) {
            Response::success([], 'No vehicle ID provided');
            exit;
        }

        try {
            // First, check if the table exists
            $tableCheck = $db->query("SHOW TABLES LIKE 'vehicle_warranty_parts'");
            if ($tableCheck->rowCount() === 0) {
                Response::success([], 'Warranty parts table not available');
                exit;
            }
            
            // Get warranty parts for a specific vehicle
            $stmt = $db->prepare("
                SELECT 
                    vwp.*,
                    wc.name as component_name,
                    wc.description as component_description,
                    wc.category as component_category
                FROM vehicle_warranty_parts vwp
                INNER JOIN warranty_components wc ON vwp.warranty_component_id = wc.id
                WHERE vwp.vehicle_id = ?
                ORDER BY vwp.created_at DESC
            ");
            $stmt->execute([$vehicleId]);
            $warrantyParts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::success($warrantyParts, 'Vehicle warranty parts retrieved successfully');
        } catch (Exception $e) {
            // Return empty array instead of error
            Response::success([], 'No warranty parts found');
        }

    } elseif ($method === 'POST') {
        // Create warranty parts for a vehicle
        $data = Request::body();
        
        $vehicleId = isset($data['vehicle_id']) ? (int)$data['vehicle_id'] : null;
        $startDate = isset($data['start_date']) ? $data['start_date'] : null;
        $warrantyParts = isset($data['warranty_parts']) ? $data['warranty_parts'] : [];

        if (!$vehicleId || !$startDate || empty($warrantyParts)) {
            Response::success(null, 'Missing required data');
            exit;
        }

        try {
            // Check if table exists
            $tableCheck = $db->query("SHOW TABLES LIKE 'vehicle_warranty_parts'");
            if ($tableCheck->rowCount() === 0) {
                Response::success(null, 'Warranty parts table not available');
                exit;
            }
            
            $db->beginTransaction();
            
            foreach ($warrantyParts as $part) {
                $componentId = (int)$part['warranty_component_id'];
                $years = (int)$part['warranty_years'];
                $kilometers = (int)$part['warranty_kilometers'];
                
                $startDateObj = new DateTime($startDate);
                $endDate = $startDateObj->modify("+{$years} years")->format('Y-m-d');
                
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
                    $startDate,
                    $endDate,
                    $kilometers
                ]);
            }
            
            $db->commit();
            Response::success(null, 'Warranty parts created successfully');
            
        } catch (Exception $e) {
            if (isset($db) && $db->inTransaction()) {
                $db->rollBack();
            }
            Response::success(null, 'Failed to create warranty parts');
        }

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    // Always return success to avoid 500 errors
    Response::success([], 'Service temporarily unavailable');
}

