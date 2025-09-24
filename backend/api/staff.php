<?php
/**
 * Staff API
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
        // Get staff with pagination and search
        $pagination = Request::getPagination();
        $search = Request::getSearch();
        $role = Request::query('role');
        $active = Request::query('active');
        
        $where = [];
        $params = [];
        
        if (!empty($search['search'])) {
            $where[] = "(s.name LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)";
            $searchTerm = '%' . $search['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        if ($role) {
            $where[] = "s.role = ?";
            $params[] = $role;
        }
        
        if ($active !== null) {
            $where[] = "s.active = ?";
            $params[] = $active === 'true' ? 1 : 0;
        }
        
        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        $query = "
            SELECT 
                s.*,
                COUNT(DISTINCT services.id) as service_count,
                COUNT(DISTINCT services2.id) as sales_count,
                MAX(services.service_date) as last_service_date
            FROM staff s
            LEFT JOIN services ON s.id = services.technician_id
            LEFT JOIN services services2 ON s.id = services2.sales_rep_id
            {$whereClause}
            GROUP BY s.id
            ORDER BY s.{$search['sortBy']} {$search['sortOrder']}
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";
        
        $staff = $db->query($query)->fetchAll(PDO::FETCH_ASSOC);
        
        // Get total count
        $countQuery = "
            SELECT COUNT(s.id) as total
            FROM staff s
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
        
        Response::paginated($staff, $paginationData, 'Staff retrieved successfully');
        
    } elseif ($method === 'POST') {
        // Create new staff member
        $data = Request::body();
        Request::validateRequired($data, ['name', 'role']);
        
        $name = Request::sanitize($data['name']);
        $role = Request::sanitize($data['role']);
        $phone = Request::sanitize($data['phone'] ?? '');
        $email = Request::sanitize($data['email'] ?? '');
        $department = Request::sanitize($data['department'] ?? '');
        $hireDate = $data['hire_date'] ?? null;
        $salary = !empty($data['salary']) ? (float)$data['salary'] : null;
        $emergencyContact = !empty($data['emergency_contact']) ? json_encode($data['emergency_contact']) : null;
        $active = $data['active'] ?? true;
        
        // Validate role
        $allowedRoles = ['admin', 'service_advisor', 'technician', 'manager'];
        if (!in_array($role, $allowedRoles)) {
            Response::validationError(['role' => 'Invalid role'], 'Invalid role');
        }
        
        // Validate email if provided
        if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::validationError(['email' => 'Invalid email format'], 'Invalid email format');
        }
        
        // Check if email already exists (if provided)
        if (!empty($email)) {
            $stmt = $db->prepare("SELECT id FROM staff WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                Response::error('Staff member with this email already exists', 409);
            }
        }
        
        $stmt = $db->prepare("
            INSERT INTO staff (
                name, role, phone, email, department, hire_date, salary, 
                emergency_contact, active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $name, $role, $phone ?: null, $email ?: null, $department ?: null,
            $hireDate, $salary, $emergencyContact, $active ? 1 : 0
        ]);
        
        $staffId = $db->lastInsertId();
        
        // Get created staff member
        $stmt = $db->prepare("SELECT * FROM staff WHERE id = ?");
        $stmt->execute([$staffId]);
        $staffMember = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::created($staffMember, 'Staff member created successfully');
        
    } else {
        Response::error('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log("Staff API error: " . $e->getMessage());
    Response::error('Failed to process staff request', 500);
}
?>
