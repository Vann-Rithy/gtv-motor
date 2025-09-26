<?php
/**
 * Service Types API
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
        // Get service types
        $query = "SELECT * FROM service_types ORDER BY service_type_name ASC";
        $serviceTypes = $db->prepare($query);
        $serviceTypes->execute();
        $serviceTypes = $serviceTypes->fetchAll(PDO::FETCH_ASSOC);

        Response::success($serviceTypes, 'Service types retrieved successfully');

    } elseif ($method === 'POST') {
        // Create new service type
        $data = Request::body();
        Request::validateRequired($data, ['service_type_name']);

        $serviceTypeName = Request::sanitize($data['service_type_name']);
        $description = Request::sanitize($data['description'] ?? '');

        // Check if service type already exists
        $stmt = $db->prepare("SELECT id FROM service_types WHERE service_type_name = ?");
        $stmt->execute([$serviceTypeName]);
        if ($stmt->fetch()) {
            Response::error('Service type already exists', 409);
        }

        $stmt = $db->prepare("
            INSERT INTO service_types (service_type_name, description, created_at)
            VALUES (?, ?, NOW())
        ");

        $stmt->execute([$serviceTypeName, $description]);
        $serviceTypeId = $db->lastInsertId();

        // Get created service type
        $stmt = $db->prepare("SELECT * FROM service_types WHERE id = ?");
        $stmt->execute([$serviceTypeId]);
        $serviceType = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::created($serviceType, 'Service type created successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Service types API error: " . $e->getMessage());
    Response::error('Failed to process service types request', 500);
}
?>
