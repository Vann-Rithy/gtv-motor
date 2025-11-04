<?php
/**
 * Vehicle Model Warranties API
 * GTV Motor PHP Backend - Vehicle Model Warranty Management
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Request.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    require_once __DIR__ . '/../config/database.php';
    $database = new Database();
    $db = $database->getConnection();

    $method = Request::method();
    $action = Request::segment(3) ?? '';

    if ($method === 'GET') {
        $modelId = Request::get('model_id');
        
        if (!$modelId) {
            Response::error('Model ID is required', 400);
        }

        // Get warranty components for a specific vehicle model
        $stmt = $db->prepare("
            SELECT 
                vmw.*,
                wc.name as component_name,
                wc.description as component_description,
                wc.category as component_category
            FROM vehicle_model_warranties vmw
            INNER JOIN warranty_components wc ON vmw.warranty_component_id = wc.id
            WHERE vmw.vehicle_model_id = ? AND vmw.is_applicable = 1
            ORDER BY wc.category, wc.name ASC
        ");
        $stmt->execute([$modelId]);
        $warranties = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success($warranties, 'Vehicle model warranties retrieved successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}




