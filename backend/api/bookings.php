<?php
/**
 * Bookings API
 * GTV Motor PHP Backend - Updated for Token Authentication
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Request.php';
require_once __DIR__ . '/../includes/Response.php';

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

        if (!$payload || !isset($payload['user_id'])) {
            Response::unauthorized('Invalid token format');
        }

        // No expiration check - token never expires for user-friendly experience

        // Get user from database
        require_once __DIR__ . '/../config/database.php';
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

    $method = Request::method();

    if ($method === 'GET') {
        // Check if requesting individual booking
        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        $segments = array_filter($segments);
        $segments = array_values($segments);

        $bookingId = null;
        if (isset($segments[2]) && is_numeric($segments[2])) {
            $bookingId = $segments[2];
        }

        if ($bookingId && is_numeric($bookingId)) {
            // Get individual booking by ID
            $stmt = $db->prepare("
                SELECT
                    b.*,
                    JSON_UNQUOTE(JSON_EXTRACT(b.customer_data, '$.name')) as customer_name,
                    JSON_UNQUOTE(JSON_EXTRACT(b.customer_data, '$.phone')) as customer_phone,
                    JSON_UNQUOTE(JSON_EXTRACT(b.customer_data, '$.email')) as customer_email,
                    JSON_UNQUOTE(JSON_EXTRACT(b.customer_data, '$.address')) as customer_address,
                    JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.plate_number')) as vehicle_plate,
                    JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.model')) as vehicle_model,
                    JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.vin_number')) as vehicle_vin,
                    JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.year')) as vehicle_year,
                    JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.current_km')) as vehicle_km,
                    st.service_type_name,
                    staff.name as assigned_staff_name,
                    staff.phone as assigned_staff_phone
                FROM bookings b
                LEFT JOIN service_types st ON b.service_type_id = st.id
                LEFT JOIN staff ON b.assigned_staff_id = staff.id
                WHERE b.id = ?
            ");
            $stmt->execute([$bookingId]);
            $booking = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$booking) {
                Response::error('Booking not found', 404);
            }

            Response::success($booking, 'Booking retrieved successfully');
            return;
        }

        // Get bookings with pagination and search
        $pagination = Request::getPagination();
        $search = Request::getSearch();
        $status = Request::query('status');
        $date = Request::query('date');

        $where = [];
        $params = [];

        if (!empty($search['search'])) {
            $where[] = "(b.phone LIKE ? OR JSON_UNQUOTE(JSON_EXTRACT(b.customer_data, '$.name')) LIKE ? OR JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.plate_number')) LIKE ? OR st.service_type_name LIKE ?)";
            $searchTerm = '%' . $search['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        if ($status) {
            $where[] = "b.status = ?";
            $params[] = $status;
        }

        if ($date) {
            $where[] = "b.booking_date = ?";
            $params[] = $date;
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $query = "
            SELECT
                b.*,
                JSON_UNQUOTE(JSON_EXTRACT(b.customer_data, '$.name')) as customer_name,
                JSON_UNQUOTE(JSON_EXTRACT(b.customer_data, '$.phone')) as customer_phone,
                JSON_UNQUOTE(JSON_EXTRACT(b.customer_data, '$.email')) as customer_email,
                JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.plate_number')) as vehicle_plate,
                JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.model')) as vehicle_model,
                JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.vin_number')) as vehicle_vin,
                JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.year')) as vehicle_year,
                st.service_type_name
            FROM bookings b
            LEFT JOIN service_types st ON b.service_type_id = st.id
            {$whereClause}
            ORDER BY b.{$search['sortBy']} {$search['sortOrder']}
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";

        $bookings = $db->prepare($query);
        $bookings->execute($params);
        $bookings = $bookings->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $countQuery = "
            SELECT COUNT(b.id) as total
            FROM bookings b
            LEFT JOIN service_types st ON b.service_type_id = st.id
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

        Response::paginated($bookings, $paginationData, 'Bookings retrieved successfully');

    } elseif ($method === 'POST') {
        // Create new booking
        $data = Request::body();
        Request::validateRequired($data, ['phone', 'customer_data', 'vehicle_data', 'service_type_id', 'booking_date', 'booking_time']);

        $phone = Request::sanitize($data['phone']);
        $customerData = json_encode($data['customer_data']);
        $vehicleData = json_encode($data['vehicle_data']);
        $serviceTypeId = (int)$data['service_type_id'];
        $bookingDate = $data['booking_date'];
        $bookingTime = $data['booking_time'];
        $status = $data['status'] ?? 'confirmed';
        $notes = Request::sanitize($data['notes'] ?? '');

        // Validate service type exists
        $stmt = $db->prepare("SELECT id FROM service_types WHERE id = ?");
        $stmt->execute([$serviceTypeId]);
        if (!$stmt->fetch()) {
            Response::error('Service type not found', 404);
        }

        // Check for conflicting bookings at the same time
        $stmt = $db->prepare("
            SELECT id FROM bookings
            WHERE booking_date = ? AND booking_time = ? AND status IN ('confirmed', 'in_progress')
        ");
        $stmt->execute([$bookingDate, $bookingTime]);
        if ($stmt->fetch()) {
            Response::error('Time slot already booked', 409);
        }

        $stmt = $db->prepare("
            INSERT INTO bookings (
                phone, customer_data, vehicle_data, service_type_id,
                booking_date, booking_time, status, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");

        $stmt->execute([
            $phone, $customerData, $vehicleData, $serviceTypeId,
            $bookingDate, $bookingTime, $status, $notes
        ]);

        $bookingId = $db->lastInsertId();

        // Get created booking with details
        $stmt = $db->prepare("
            SELECT
                b.*,
                JSON_UNQUOTE(JSON_EXTRACT(b.customer_data, '$.name')) as customer_name,
                JSON_UNQUOTE(JSON_EXTRACT(b.customer_data, '$.phone')) as customer_phone,
                JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.plate_number')) as vehicle_plate,
                JSON_UNQUOTE(JSON_EXTRACT(b.vehicle_data, '$.model')) as vehicle_model,
                st.service_type_name
            FROM bookings b
            LEFT JOIN service_types st ON b.service_type_id = st.id
            WHERE b.id = ?
        ");
        $stmt->execute([$bookingId]);
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::created($booking, 'Booking created successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Bookings API error: " . $e->getMessage());
    Response::error('Failed to process bookings request', 500);
}
?>
