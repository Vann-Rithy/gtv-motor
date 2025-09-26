<?php
/**
 * Service Alerts API
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
        // Get alerts with pagination and search
        $pagination = Request::getPagination();
        $search = Request::getSearch();
        $status = Request::query('status');
        $alertType = Request::query('alert_type');
        $customerId = Request::query('customer_id');
        $vehicleId = Request::query('vehicle_id');
        $urgency = Request::query('urgency');

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
            $where[] = "sa.status = ?";
            $params[] = $status;
        }

        if ($alertType) {
            $where[] = "sa.alert_type = ?";
            $params[] = $alertType;
        }

        if ($customerId) {
            $where[] = "sa.customer_id = ?";
            $params[] = $customerId;
        }

        if ($vehicleId) {
            $where[] = "sa.vehicle_id = ?";
            $params[] = $vehicleId;
        }

        if ($urgency) {
            switch ($urgency) {
                case 'overdue':
                    $where[] = "sa.alert_date < CURDATE()";
                    break;
                case 'due_today':
                    $where[] = "sa.alert_date = CURDATE()";
                    break;
                case 'due_soon':
                    $where[] = "sa.alert_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)";
                    break;
                case 'upcoming':
                    $where[] = "sa.alert_date > DATE_ADD(CURDATE(), INTERVAL 7 DAY)";
                    break;
            }
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $query = "
            SELECT
                sa.*,
                c.name as customer_name,
                c.phone as customer_phone,
                c.email as customer_email,
                c.address as customer_address,
                v.plate_number as vehicle_plate,
                v.model as vehicle_model,
                v.vin_number as vehicle_vin,
                v.year as vehicle_year,
                DATEDIFF(sa.alert_date, CURDATE()) as days_until_due,
                CASE
                    WHEN sa.alert_date < CURDATE() THEN 'overdue'
                    WHEN sa.alert_date = CURDATE() THEN 'due_today'
                    WHEN sa.alert_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'due_soon'
                    ELSE 'upcoming'
                END as urgency_level
            FROM service_alerts sa
            LEFT JOIN customers c ON sa.customer_id = c.id
            LEFT JOIN vehicles v ON sa.vehicle_id = v.id
            {$whereClause}
            ORDER BY sa.alert_date ASC, sa.created_at DESC
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";

        $alerts = $db->prepare($query);
        $alerts->execute($params);
        $alerts = $alerts->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $countQuery = "
            SELECT COUNT(sa.id) as total
            FROM service_alerts sa
            LEFT JOIN customers c ON sa.customer_id = c.id
            LEFT JOIN vehicles v ON sa.vehicle_id = v.id
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

        Response::paginated($alerts, $paginationData, 'Alerts retrieved successfully');

    } elseif ($method === 'POST') {
        // Create new alert
        $data = Request::body();
        Request::validateRequired($data, ['customer_id', 'vehicle_id', 'alert_type', 'alert_date']);

        $customerId = (int)$data['customer_id'];
        $vehicleId = (int)$data['vehicle_id'];
        $alertType = Request::sanitize($data['alert_type']);
        $alertDate = $data['alert_date'];
        $message = Request::sanitize($data['message'] ?? '');
        $status = $data['status'] ?? 'pending';

        // Validate customer exists
        $stmt = $db->prepare("SELECT id FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        if (!$stmt->fetch()) {
            Response::error('Customer not found', 404);
        }

        // Validate vehicle exists
        $stmt = $db->prepare("SELECT id FROM vehicles WHERE id = ?");
        $stmt->execute([$vehicleId]);
        if (!$stmt->fetch()) {
            Response::error('Vehicle not found', 404);
        }

        $stmt = $db->prepare("
            INSERT INTO service_alerts (
                customer_id, vehicle_id, alert_type, alert_date, message, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");

        $stmt->execute([$customerId, $vehicleId, $alertType, $alertDate, $message, $status]);
        $alertId = $db->lastInsertId();

        // Get created alert with details
        $stmt = $db->prepare("
            SELECT
                sa.*,
                c.name as customer_name,
                c.phone as customer_phone,
                v.plate_number as vehicle_plate,
                v.model as vehicle_model
            FROM service_alerts sa
            LEFT JOIN customers c ON sa.customer_id = c.id
            LEFT JOIN vehicles v ON sa.vehicle_id = v.id
            WHERE sa.id = ?
        ");
        $stmt->execute([$alertId]);
        $alert = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::created($alert, 'Alert created successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Alerts API error: " . $e->getMessage());
    Response::error('Failed to process alerts request', 500);
}
?>
