<?php
/**
 * Customer Reports API
 * GTV Motor PHP Backend - Updated for Token Authentication
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/Request.php';
require_once __DIR__ . '/../../includes/Response.php';

try {
    // Get token from URL parameter first, then Authorization header
    $token = $_GET['token'] ?? Request::authorization();

    if (!$token) {
        Response::unauthorized('No authorization token provided');
    }

    // Remove 'Bearer ' prefix if present
    $token = str_replace('Bearer ', '', $token);

    // Simple token validation (base64 encoded JSON)
    try {
        $payload = json_decode(base64_decode($token), true);

        if (!$payload || !isset($payload['user_id']) || !isset($payload['exp'])) {
            Response::unauthorized('Invalid token format');
        }

        // Check if token is expired
        if ($payload['exp'] < time()) {
            Response::unauthorized('Token expired');
        }

        // Get user from database
        require_once __DIR__ . '/../../config/database.php';
        $database = new Database();
        $conn = $database->getConnection();

        $stmt = $conn->prepare("
            SELECT u.*, s.name as staff_name, s.role as staff_role
            FROM users u
            LEFT JOIN staff s ON u.staff_id = s.id
            WHERE u.id = ? AND u.is_active = 1
        ");
        $stmt->execute([$payload['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            Response::unauthorized('User not found or inactive');
        }

    } catch (Exception $e) {
        Response::unauthorized('Invalid token');
    }

    $database = new Database();
    $db = $database->getConnection();

    $fromDate = Request::query('from') ?? '2024-01-01';
    $toDate = Request::query('to') ?? date('Y-m-d');
    $customerId = Request::query('customer_id');

    if ($customerId) {
        // Get specific customer report
        $stmt = $db->prepare("
            SELECT
                c.*,
                COUNT(DISTINCT v.id) as vehicle_count,
                COUNT(DISTINCT s.id) as service_count,
                COALESCE(SUM(s.total_amount), 0) as total_spent,
                MAX(s.service_date) as last_service_date,
                MIN(s.service_date) as first_service_date
            FROM customers c
            LEFT JOIN vehicles v ON c.id = v.customer_id
            LEFT JOIN services s ON c.id = s.customer_id
            WHERE c.id = ?
            GROUP BY c.id
        ");
        $stmt->execute([$customerId]);
        $customer = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$customer) {
            Response::error('Customer not found', 404);
        }

        // Get customer's vehicles
        $stmt = $db->prepare("
            SELECT
                v.*,
                COUNT(s.id) as service_count,
                MAX(s.service_date) as last_service_date,
                COALESCE(SUM(s.total_amount), 0) as total_service_amount
            FROM vehicles v
            LEFT JOIN services s ON v.id = s.vehicle_id
            WHERE v.customer_id = ?
            GROUP BY v.id
            ORDER BY v.created_at DESC
        ");
        $stmt->execute([$customerId]);
        $vehicles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get customer's services
        $stmt = $db->prepare("
            SELECT
                s.*,
                v.plate_number as vehicle_plate,
                v.model as vehicle_model,
                st.service_type_name,
                tech.name as technician_name,
                sales.name as sales_rep_name
            FROM services s
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN service_types st ON s.service_type_id = st.id
            LEFT JOIN staff tech ON s.technician_id = tech.id
            LEFT JOIN staff sales ON s.sales_rep_id = sales.id
            WHERE s.customer_id = ?
            AND DATE(s.service_date) BETWEEN ? AND ?
            ORDER BY s.service_date DESC
        ");
        $stmt->execute([$customerId, $fromDate, $toDate]);
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get service history by month
        $stmt = $db->prepare("
            SELECT
                DATE_FORMAT(s.service_date, '%Y-%m') as month,
                COUNT(*) as service_count,
                COALESCE(SUM(s.total_amount), 0) as total_amount
            FROM services s
            WHERE s.customer_id = ?
            AND DATE(s.service_date) BETWEEN ? AND ?
            GROUP BY DATE_FORMAT(s.service_date, '%Y-%m')
            ORDER BY month
        ");
        $stmt->execute([$customerId, $fromDate, $toDate]);
        $serviceHistory = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $customerReport = [
            'customer' => $customer,
            'vehicles' => $vehicles,
            'services' => $services,
            'service_history' => $serviceHistory,
            'period' => [
                'from' => $fromDate,
                'to' => $toDate
            ]
        ];

        Response::success($customerReport, 'Customer report generated successfully');

    } else {
        // Get all customers report
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
                c.*,
                COUNT(DISTINCT v.id) as vehicle_count,
                COUNT(DISTINCT s.id) as service_count,
                COALESCE(SUM(s.total_amount), 0) as total_spent,
                MAX(s.service_date) as last_service_date,
                MIN(s.service_date) as first_service_date,
                SUM(CASE WHEN s.service_status = 'completed' THEN 1 ELSE 0 END) as completed_services,
                SUM(CASE WHEN s.service_status = 'pending' THEN 1 ELSE 0 END) as pending_services
            FROM customers c
            LEFT JOIN vehicles v ON c.id = v.customer_id
            LEFT JOIN services s ON c.id = s.customer_id
            {$whereClause}
            GROUP BY c.id
            ORDER BY c.{$search['sortBy']} {$search['sortOrder']}
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";

        $customers = $db->prepare($query);
        $customers->execute($params);
        $customers = $customers->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $countQuery = "
            SELECT COUNT(DISTINCT c.id) as total
            FROM customers c
            LEFT JOIN vehicles v ON c.id = v.customer_id
            LEFT JOIN services s ON c.id = s.customer_id
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

        Response::paginated($customers, $paginationData, 'Customer report generated successfully');
    }

} catch (Exception $e) {
    error_log("Customer reports API error: " . $e->getMessage());
    Response::error('Failed to generate customer report', 500);
}
?>
