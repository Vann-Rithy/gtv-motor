<?php
/**
 * Customers API
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
        // Get customers with pagination and search
        $pagination = Request::getPagination();
        $search = Request::getSearch();
        
        $where = [];
        $params = [];
        
        if (!empty($search['search'])) {
            $where[] = "(c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)";
            $searchTerm = '%' . $search['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        $query = "
            SELECT 
                c.id, c.name, c.phone, c.address, c.email, c.created_at, c.updated_at,
                COUNT(DISTINCT v.id) as vehicle_count,
                COUNT(DISTINCT s.id) as service_count,
                COUNT(DISTINCT sa.id) as alert_count,
                COUNT(DISTINCT b.id) as booking_count,
                MAX(s.service_date) as last_service_date,
                SUM(s.total_amount) as total_spent,
                v_latest.plate_number as latest_vehicle_plate,
                v_latest.model as latest_vehicle_model,
                v_latest.warranty_end_date as latest_warranty_end,
                SUM(CASE WHEN s.service_status = 'pending' THEN 1 ELSE 0 END) as pending_services,
                SUM(CASE WHEN s.service_status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_services,
                SUM(CASE WHEN s.service_status = 'completed' THEN 1 ELSE 0 END) as completed_services,
                SUM(CASE WHEN sa.status = 'pending' AND sa.alert_date <= CURDATE() THEN 1 ELSE 0 END) as pending_alerts
            FROM customers c
            LEFT JOIN vehicles v ON c.id = v.customer_id
            LEFT JOIN services s ON c.id = s.customer_id
            LEFT JOIN service_alerts sa ON c.id = sa.customer_id
            LEFT JOIN bookings b ON JSON_UNQUOTE(JSON_EXTRACT(b.customer_data, '$.phone')) = c.phone
            LEFT JOIN (
                SELECT DISTINCT customer_id, plate_number, model, warranty_end_date,
                       ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) as rn
                FROM vehicles
            ) v_latest ON c.id = v_latest.customer_id AND v_latest.rn = 1
            {$whereClause}
            GROUP BY c.id
            ORDER BY c.{$search['sortBy']} {$search['sortOrder']}
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";
        
        $customers = $db->query($query)->fetchAll(PDO::FETCH_ASSOC);
        
        // Get total count
        $countQuery = "
            SELECT COUNT(DISTINCT c.id) as total
            FROM customers c
            LEFT JOIN vehicles v ON c.id = v.customer_id
            LEFT JOIN services s ON c.id = s.customer_id
            LEFT JOIN service_alerts sa ON c.id = sa.customer_id
            LEFT JOIN bookings b ON JSON_UNQUOTE(JSON_EXTRACT(b.customer_data, '$.phone')) = c.phone
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
        
        Response::paginated($customers, $paginationData, 'Customers retrieved successfully');
        
    } elseif ($method === 'POST') {
        // Create new customer
        $data = Request::body();
        Request::validateRequired($data, ['name', 'phone']);
        
        $name = Request::sanitize($data['name']);
        $phone = Request::sanitize($data['phone']);
        $address = Request::sanitize($data['address'] ?? '');
        $email = Request::sanitize($data['email'] ?? '');
        
        // Validate email if provided
        if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::validationError(['email' => 'Invalid email format'], 'Invalid email format');
        }
        
        // Check if phone already exists
        $stmt = $db->prepare("SELECT id FROM customers WHERE phone = ?");
        $stmt->execute([$phone]);
        if ($stmt->fetch()) {
            Response::error('Customer with this phone number already exists', 409);
        }
        
        // Check if email already exists (if provided)
        if (!empty($email)) {
            $stmt = $db->prepare("SELECT id FROM customers WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                Response::error('Customer with this email already exists', 409);
            }
        }
        
        $stmt = $db->prepare("
            INSERT INTO customers (name, phone, address, email, created_at, updated_at)
            VALUES (?, ?, ?, ?, NOW(), NOW())
        ");
        
        $stmt->execute([$name, $phone, $address, $email ?: null]);
        $customerId = $db->lastInsertId();
        
        // Get created customer
        $stmt = $db->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        $customer = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::created($customer, 'Customer created successfully');
        
    } else {
        Response::error('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log("Customers API error: " . $e->getMessage());
    Response::error('Failed to process customers request', 500);
}
?>
