<?php
/**
 * Staff API
 * GTV Motor PHP Backend - Updated for Token Authentication
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
        // Get all staff members from database
        $stmt = $db->prepare("
            SELECT 
                id,
                name,
                role,
                phone,
                email,
                active,
                department,
                hire_date,
                salary,
                emergency_contact,
                created_at,
                updated_at
            FROM staff
            ORDER BY created_at DESC
        ");
        $stmt->execute();
        $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Convert active to boolean and format dates
        foreach ($staff as &$member) {
            $member['active'] = (bool)$member['active'];
            if ($member['emergency_contact']) {
                $member['emergency_contact'] = json_decode($member['emergency_contact'], true);
            }
        }

        Response::success($staff, 'Staff retrieved successfully');

    } elseif ($method === 'POST') {
        // Create new staff member
        $data = Request::body();
        
        // Validate required fields
        Request::validateRequired($data, ['name', 'role']);
        
        $name = Request::sanitize($data['name']);
        $role = Request::sanitize($data['role']);
        $phone = isset($data['phone']) ? Request::sanitize($data['phone']) : null;
        $email = isset($data['email']) ? Request::sanitize($data['email']) : null;
        $department = isset($data['department']) ? Request::sanitize($data['department']) : null;
        $hireDate = isset($data['hire_date']) ? Request::sanitize($data['hire_date']) : null;
        $salary = isset($data['salary']) ? (float)$data['salary'] : null;
        $emergencyContact = isset($data['emergency_contact']) ? json_encode($data['emergency_contact']) : null;
        $active = isset($data['active']) ? (int)$data['active'] : 1;

        // Validate role
        $allowedRoles = ['admin', 'service_advisor', 'technician', 'manager'];
        if (!in_array($role, $allowedRoles)) {
            Response::validationError(['role' => 'Invalid role. Must be one of: ' . implode(', ', $allowedRoles)], 'Invalid role');
        }

        // Validate email format if provided
        if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::validationError(['email' => 'Invalid email format'], 'Invalid email format');
        }

        // Insert staff member
        $stmt = $db->prepare("
            INSERT INTO staff (
                name, 
                role, 
                phone, 
                email, 
                department,
                hire_date,
                salary,
                emergency_contact,
                active,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");

        $stmt->execute([
            $name,
            $role,
            $phone,
            $email,
            $department,
            $hireDate,
            $salary,
            $emergencyContact,
            $active
        ]);

        $staffId = $db->lastInsertId();

        // Get the created staff member
        $stmt = $db->prepare("SELECT * FROM staff WHERE id = ?");
        $stmt->execute([$staffId]);
        $staff = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Format response
        $staff['active'] = (bool)$staff['active'];
        if ($staff['emergency_contact']) {
            $staff['emergency_contact'] = json_decode($staff['emergency_contact'], true);
        }

        Response::created($staff, 'Staff member added successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Staff API error: " . $e->getMessage());
    Response::error('Failed to process staff request', 500);
}
?>
