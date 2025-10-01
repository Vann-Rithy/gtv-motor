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
            // Get individual warranty by ID
            $stmt = $db->prepare("SELECT * FROM warranties WHERE id = ?");
            $stmt->execute([$warrantyId]);
            $warranty = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$warranty) {
                Response::error('Warranty not found', 404);
            }

            Response::success($warranty, 'Warranty retrieved successfully');
            return;
        }

        // Get warranties with pagination
        $pagination = Request::getPagination();

        $query = "
            SELECT *
            FROM warranties
            ORDER BY created_at DESC
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";

        $stmt = $db->prepare($query);
        $stmt->execute();
        $warranties = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM warranties";
        $stmt = $db->prepare($countQuery);
        $stmt->execute();
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        $paginationData = [
            'total' => (int)$total,
            'page' => $pagination['page'],
            'limit' => $pagination['limit'],
            'totalPages' => ceil($total / $pagination['limit'])
        ];

        Response::paginated($warranties, $paginationData, 'Warranties retrieved successfully');

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