<?php
/**
 * Vehicle Models API
 * GTV Motor PHP Backend - Dynamic Vehicle Model Management
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
        // Get all vehicle models
        $stmt = $db->prepare("
            SELECT
                id,
                name,
                description,
                category,
                base_price,
                estimated_duration,
                warranty_km_limit,
                warranty_max_services,
                engine_type,
                cc_displacement,
                fuel_type,
                transmission,
                color_options,
                year_range,
                specifications,
                is_active,
                created_at,
                updated_at
            FROM vehicle_models
            WHERE is_active = 1
            ORDER BY name ASC
        ");
        $stmt->execute();
        $models = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success($models, 'Vehicle models retrieved successfully');

    } elseif ($method === 'POST') {
        // Create new vehicle model
        $data = Request::body();
        Request::validateRequired($data, ['name']);

        $name = Request::sanitize($data['name']);
        $description = Request::sanitize($data['description'] ?? '');
        $category = Request::sanitize($data['category'] ?? 'Motorcycle');
        $basePrice = isset($data['base_price']) ? (float)$data['base_price'] : 0.00;
        $estimatedDuration = isset($data['estimated_duration']) ? (int)$data['estimated_duration'] : 60;
        $warrantyKmLimit = isset($data['warranty_km_limit']) ? (int)$data['warranty_km_limit'] : 15000;
        $warrantyMaxServices = isset($data['warranty_max_services']) ? (int)$data['warranty_max_services'] : 2;
        $engineType = Request::sanitize($data['engine_type'] ?? '4-Stroke');
        $ccDisplacement = isset($data['cc_displacement']) ? (int)$data['cc_displacement'] : null;
        $fuelType = Request::sanitize($data['fuel_type'] ?? 'Gasoline');
        $transmission = Request::sanitize($data['transmission'] ?? 'Manual');
        $colorOptions = isset($data['color_options']) ? json_encode($data['color_options']) : null;
        $yearRange = Request::sanitize($data['year_range'] ?? null);
        $specifications = isset($data['specifications']) ? json_encode($data['specifications']) : null;
        $isActive = isset($data['is_active']) ? (int)$data['is_active'] : 1;

        // Check if model name already exists
        $stmt = $db->prepare("SELECT id FROM vehicle_models WHERE name = ?");
        $stmt->execute([$name]);
        if ($stmt->fetch()) {
            Response::error('Vehicle model with this name already exists', 409);
        }

        $stmt = $db->prepare("
            INSERT INTO vehicle_models (
                name, description, category, base_price, estimated_duration,
                warranty_km_limit, warranty_max_services, engine_type, cc_displacement,
                fuel_type, transmission, color_options, year_range, specifications,
                is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $name, $description, $category, $basePrice, $estimatedDuration,
            $warrantyKmLimit, $warrantyMaxServices, $engineType, $ccDisplacement,
            $fuelType, $transmission, $colorOptions, $yearRange, $specifications, $isActive
        ]);

        $modelId = $db->lastInsertId();

        // Get the created model
        $stmt = $db->prepare("
            SELECT
                id, name, description, category, base_price, estimated_duration,
                warranty_km_limit, warranty_max_services, engine_type, cc_displacement,
                fuel_type, transmission, color_options, year_range, specifications,
                is_active, created_at, updated_at
            FROM vehicle_models
            WHERE id = ?
        ");
        $stmt->execute([$modelId]);
        $model = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::created($model, 'Vehicle model created successfully');

    } elseif ($method === 'PUT') {
        // Update vehicle model
        $modelId = Request::segment(2);
        if (!$modelId || !is_numeric($modelId)) {
            Response::error('Vehicle model ID is required', 400);
        }

        $data = Request::body();
        Request::validateRequired($data, ['name']);

        $name = Request::sanitize($data['name']);
        $description = Request::sanitize($data['description'] ?? '');
        $category = Request::sanitize($data['category'] ?? 'Motorcycle');
        $basePrice = isset($data['base_price']) ? (float)$data['base_price'] : 0.00;
        $estimatedDuration = isset($data['estimated_duration']) ? (int)$data['estimated_duration'] : 60;
        $warrantyKmLimit = isset($data['warranty_km_limit']) ? (int)$data['warranty_km_limit'] : 15000;
        $warrantyMaxServices = isset($data['warranty_max_services']) ? (int)$data['warranty_max_services'] : 2;
        $engineType = Request::sanitize($data['engine_type'] ?? '4-Stroke');
        $ccDisplacement = isset($data['cc_displacement']) ? (int)$data['cc_displacement'] : null;
        $fuelType = Request::sanitize($data['fuel_type'] ?? 'Gasoline');
        $transmission = Request::sanitize($data['transmission'] ?? 'Manual');
        $colorOptions = isset($data['color_options']) ? json_encode($data['color_options']) : null;
        $yearRange = Request::sanitize($data['year_range'] ?? null);
        $specifications = isset($data['specifications']) ? json_encode($data['specifications']) : null;
        $isActive = isset($data['is_active']) ? (int)$data['is_active'] : 1;

        // Check if model exists
        $stmt = $db->prepare("SELECT id FROM vehicle_models WHERE id = ?");
        $stmt->execute([$modelId]);
        if (!$stmt->fetch()) {
            Response::error('Vehicle model not found', 404);
        }

        // Check if name already exists for different model
        $stmt = $db->prepare("SELECT id FROM vehicle_models WHERE name = ? AND id != ?");
        $stmt->execute([$name, $modelId]);
        if ($stmt->fetch()) {
            Response::error('Vehicle model with this name already exists', 409);
        }

        $stmt = $db->prepare("
            UPDATE vehicle_models
            SET name = ?, description = ?, category = ?, base_price = ?, estimated_duration = ?,
                warranty_km_limit = ?, warranty_max_services = ?, engine_type = ?, cc_displacement = ?,
                fuel_type = ?, transmission = ?, color_options = ?, year_range = ?, specifications = ?,
                is_active = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([
            $name, $description, $category, $basePrice, $estimatedDuration,
            $warrantyKmLimit, $warrantyMaxServices, $engineType, $ccDisplacement,
            $fuelType, $transmission, $colorOptions, $yearRange, $specifications, $isActive, $modelId
        ]);

        // Get the updated model
        $stmt = $db->prepare("
            SELECT
                id, name, description, category, base_price, estimated_duration,
                warranty_km_limit, warranty_max_services, engine_type, cc_displacement,
                fuel_type, transmission, color_options, year_range, specifications,
                is_active, created_at, updated_at
            FROM vehicle_models
            WHERE id = ?
        ");
        $stmt->execute([$modelId]);
        $model = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::success($model, 'Vehicle model updated successfully');

    } elseif ($method === 'DELETE') {
        // Soft delete vehicle model (set is_active = 0)
        $modelId = Request::segment(2);
        if (!$modelId || !is_numeric($modelId)) {
            Response::error('Vehicle model ID is required', 400);
        }

        // Check if model exists
        $stmt = $db->prepare("SELECT id FROM vehicle_models WHERE id = ?");
        $stmt->execute([$modelId]);
        if (!$stmt->fetch()) {
            Response::error('Vehicle model not found', 404);
        }

        // Check if model is being used by any vehicles
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM vehicles WHERE model = (SELECT name FROM vehicle_models WHERE id = ?)");
        $stmt->execute([$modelId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result['count'] > 0) {
            Response::error('Cannot delete vehicle model that is being used by existing vehicles', 409);
        }

        $stmt = $db->prepare("
            UPDATE vehicle_models
            SET is_active = 0, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$modelId]);

        Response::success(null, 'Vehicle model deleted successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Vehicle Models API error: " . $e->getMessage());
    Response::error('Failed to process vehicle models request', 500);
}
?>
