<?php
/**
 * Warranties API
 * GTV Motor PHP Backend
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/Auth.php';

try {
    $auth = new Auth();
    $user = $auth->requireAuth();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $method = Request::method();
    
    if ($method === 'GET') {
        // Get warranties with pagination and search
        $pagination = Request::getPagination();
        $search = Request::getSearch();
        $status = Request::query('status');
        $vehicleId = Request::query('vehicle_id');
        $expiringSoon = Request::query('expiring_soon') === 'true';
        
        $where = [];
        $params = [];
        
        if (!empty($search['search'])) {
            $where[] = "(c.name LIKE ? OR v.plate_number LIKE ? OR v.model LIKE ?)";
            $searchTerm = '%' . $search['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        if ($status) {
            $where[] = "w.status = ?";
            $params[] = $status;
        }
        
        if ($vehicleId) {
            $where[] = "w.vehicle_id = ?";
            $params[] = $vehicleId;
        }
        
        if ($expiringSoon) {
            $where[] = "w.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)";
        }
        
        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        $query = "
            SELECT 
                w.*,
                c.name as customer_name,
                c.phone as customer_phone,
                c.email as customer_email,
                c.address as customer_address,
                v.plate_number as vehicle_plate,
                v.model as vehicle_model,
                v.vin_number as vehicle_vin,
                v.year as vehicle_year,
                v.current_km,
                COUNT(DISTINCT ws.id) as services_used,
                MAX(ws.service_date) as last_service_date,
                COALESCE(SUM(ws.cost_covered), 0) as total_cost_covered,
                DATEDIFF(w.end_date, CURDATE()) as days_until_expiry
            FROM warranties w
            LEFT JOIN vehicles v ON w.vehicle_id = v.id
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN warranty_services ws ON w.id = ws.warranty_id
            {$whereClause}
            GROUP BY w.id
            ORDER BY w.{$search['sortBy']} {$search['sortOrder']}
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";
        
        $warranties = $db->query($query)->fetchAll(PDO::FETCH_ASSOC);
        
        // Get total count
        $countQuery = "
            SELECT COUNT(DISTINCT w.id) as total
            FROM warranties w
            LEFT JOIN vehicles v ON w.vehicle_id = v.id
            LEFT JOIN customers c ON v.customer_id = c.id
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
        
        Response::paginated($warranties, $paginationData, 'Warranties retrieved successfully');
        
    } elseif ($method === 'POST') {
        // Create new warranty
        $data = Request::body();
        Request::validateRequired($data, ['vehicle_id', 'warranty_type', 'start_date', 'end_date']);
        
        $vehicleId = (int)$data['vehicle_id'];
        $warrantyType = Request::sanitize($data['warranty_type']);
        $startDate = $data['start_date'];
        $endDate = $data['end_date'];
        $kmLimit = !empty($data['km_limit']) ? (int)$data['km_limit'] : 100000;
        $maxServices = !empty($data['max_services']) ? (int)$data['max_services'] : 10;
        $termsConditions = Request::sanitize($data['terms_conditions'] ?? '');
        $status = $data['status'] ?? 'active';
        
        // Validate vehicle exists
        $stmt = $db->prepare("SELECT id FROM vehicles WHERE id = ?");
        $stmt->execute([$vehicleId]);
        if (!$stmt->fetch()) {
            Response::error('Vehicle not found', 404);
        }
        
        // Check if vehicle already has an active warranty
        $stmt = $db->prepare("SELECT id FROM warranties WHERE vehicle_id = ? AND status = 'active'");
        $stmt->execute([$vehicleId]);
        if ($stmt->fetch()) {
            Response::error('Vehicle already has an active warranty', 409);
        }
        
        $stmt = $db->prepare("
            INSERT INTO warranties (
                vehicle_id, warranty_type, start_date, end_date, km_limit, 
                max_services, terms_conditions, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $vehicleId, $warrantyType, $startDate, $endDate, $kmLimit,
            $maxServices, $termsConditions, $status
        ]);
        
        $warrantyId = $db->lastInsertId();
        
        // Get created warranty with details
        $stmt = $db->prepare("
            SELECT 
                w.*,
                c.name as customer_name,
                c.phone as customer_phone,
                v.plate_number as vehicle_plate,
                v.model as vehicle_model
            FROM warranties w
            LEFT JOIN vehicles v ON w.vehicle_id = v.id
            LEFT JOIN customers c ON v.customer_id = c.id
            WHERE w.id = ?
        ");
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
