<?php
/**
 * Bookings API
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
        
        $bookings = $db->query($query)->fetchAll(PDO::FETCH_ASSOC);
        
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
