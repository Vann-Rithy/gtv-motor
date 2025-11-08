<?php
/**
 * Bookings API
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
                // Get individual booking by ID - simplified without JSON extraction
                $stmt = $db->prepare("
                    SELECT
                        b.*,
                        st.service_type_name
                    FROM bookings b
                    LEFT JOIN service_types st ON b.service_type_id = st.id
                    WHERE b.id = ?
                ");
                $stmt->execute([$bookingId]);
                $booking = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$booking) {
                    Response::error('Booking not found', 404);
                }

                // Parse JSON data manually
                if ($booking['customer_data']) {
                    $customerData = json_decode($booking['customer_data'], true);
                    if ($customerData) {
                        $booking['customer_name'] = $customerData['name'] ?? '';
                        $booking['customer_phone'] = $customerData['phone'] ?? '';
                        $booking['customer_email'] = $customerData['email'] ?? '';
                        $booking['customer_address'] = $customerData['address'] ?? '';

                        // Find customer ID by phone number
                        if ($customerData['phone']) {
                            $customerStmt = $db->prepare("SELECT id FROM customers WHERE phone = ? LIMIT 1");
                            $customerStmt->execute([$customerData['phone']]);
                            $customerId = $customerStmt->fetchColumn();
                            $booking['customer_id'] = $customerId !== false ? (int)$customerId : null;
                        }
                    }
                }

                if ($booking['vehicle_data']) {
                    $vehicleData = json_decode($booking['vehicle_data'], true);
                    if ($vehicleData) {
                        $booking['vehicle_plate'] = $vehicleData['plate_number'] ?? '';
                        $booking['vehicle_model'] = $vehicleData['model'] ?? '';
                        $booking['vehicle_vin'] = $vehicleData['vin_number'] ?? '';
                        $booking['vehicle_year'] = $vehicleData['year'] ?? '';
                        $booking['vehicle_km'] = $vehicleData['current_km'] ?? '';

                        // Find vehicle ID by plate number, prioritizing vehicles that belong to the customer
                        if ($vehicleData['plate_number'] && isset($booking['customer_id'])) {
                            // First try to find a vehicle with the plate number that belongs to the customer
                            $vehicleStmt = $db->prepare("SELECT id FROM vehicles WHERE plate_number = ? AND customer_id = ? LIMIT 1");
                            $vehicleStmt->execute([$vehicleData['plate_number'], $booking['customer_id']]);
                            $vehicleId = $vehicleStmt->fetchColumn();

                            // If not found, fall back to any vehicle with that plate number
                            if (!$vehicleId) {
                                $vehicleStmt = $db->prepare("SELECT id FROM vehicles WHERE plate_number = ? LIMIT 1");
                                $vehicleStmt->execute([$vehicleData['plate_number']]);
                                $vehicleId = $vehicleStmt->fetchColumn();
                            }

                            $booking['vehicle_id'] = $vehicleId !== false ? (int)$vehicleId : null;
                        }
                    }
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
            $where[] = "(b.phone LIKE ? OR st.service_type_name LIKE ?)";
            $searchTerm = '%' . $search['search'] . '%';
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

        // Parse JSON data for each booking
        foreach ($bookings as &$booking) {
            if ($booking['customer_data']) {
                $customerData = json_decode($booking['customer_data'], true);
                if ($customerData) {
                    $booking['customer_name'] = $customerData['name'] ?? '';
                    $booking['customer_phone'] = $customerData['phone'] ?? '';
                    $booking['customer_email'] = $customerData['email'] ?? '';

                    // Find customer ID by phone number
                    if ($customerData['phone']) {
                        $customerStmt = $db->prepare("SELECT id FROM customers WHERE phone = ? LIMIT 1");
                        $customerStmt->execute([$customerData['phone']]);
                        $customerId = $customerStmt->fetchColumn();
                                $booking['customer_id'] = $customerId !== false ? (int)$customerId : null;
                    }
                }
            }

            if ($booking['vehicle_data']) {
                $vehicleData = json_decode($booking['vehicle_data'], true);
                if ($vehicleData) {
                    $booking['vehicle_plate'] = $vehicleData['plate_number'] ?? '';
                    $booking['vehicle_model'] = $vehicleData['model'] ?? '';
                    $booking['vehicle_vin'] = $vehicleData['vin_number'] ?? '';
                    $booking['vehicle_year'] = $vehicleData['year'] ?? '';

                    // Find vehicle ID by plate number, prioritizing vehicles that belong to the customer
                    if ($vehicleData['plate_number'] && isset($booking['customer_id'])) {
                        // First try to find a vehicle with the plate number that belongs to the customer
                        $vehicleStmt = $db->prepare("SELECT id FROM vehicles WHERE plate_number = ? AND customer_id = ? LIMIT 1");
                        $vehicleStmt->execute([$vehicleData['plate_number'], $booking['customer_id']]);
                        $vehicleId = $vehicleStmt->fetchColumn();

                        // If not found, fall back to any vehicle with that plate number
                        if (!$vehicleId) {
                            $vehicleStmt = $db->prepare("SELECT id FROM vehicles WHERE plate_number = ? LIMIT 1");
                            $vehicleStmt->execute([$vehicleData['plate_number']]);
                            $vehicleId = $vehicleStmt->fetchColumn();
                        }

                                $booking['vehicle_id'] = $vehicleId !== false ? (int)$vehicleId : null;
                    }
                }
            }
        }

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

    } elseif ($method === 'PUT') {
        // Update booking - supports partial updates
        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        $segments = array_filter($segments);
        $segments = array_values($segments);

        $bookingId = null;
        if (isset($segments[2]) && is_numeric($segments[2])) {
            $bookingId = $segments[2];
        }

        if (!$bookingId) {
            Response::error('Booking ID is required', 400);
        }

        $data = Request::body();
        
        // Check if this is a partial update (only status) or full update
        // Partial update: only status field, or status + notes (which is optional)
        $hasStatus = isset($data['status']);
        $hasOnlyStatusFields = $hasStatus && 
            (!isset($data['customer_id']) && !isset($data['vehicle_id']) && 
             !isset($data['service_type_id']) && !isset($data['booking_date']) && 
             !isset($data['booking_time']));
        
        if ($hasOnlyStatusFields) {
            // Partial update - only update status (and optionally notes)
            $status = Request::sanitize($data['status']);
            $notes = isset($data['notes']) ? Request::sanitize($data['notes']) : null;
            
            if ($notes !== null) {
                $stmt = $db->prepare("
                    UPDATE bookings
                    SET status = ?, notes = ?, updated_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$status, $notes, $bookingId]);
            } else {
                $stmt = $db->prepare("
                    UPDATE bookings
                    SET status = ?, updated_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$status, $bookingId]);
            }
            
            // Get updated booking
            $stmt = $db->prepare("
                SELECT
                    b.*,
                    st.service_type_name
                FROM bookings b
                LEFT JOIN service_types st ON b.service_type_id = st.id
                WHERE b.id = ?
            ");
            $stmt->execute([$bookingId]);
            $booking = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Parse JSON data
            if ($booking['customer_data']) {
                $customerData = json_decode($booking['customer_data'], true);
                if ($customerData) {
                    $booking['customer_name'] = $customerData['name'] ?? '';
                    $booking['customer_phone'] = $customerData['phone'] ?? '';
                    $booking['customer_email'] = $customerData['email'] ?? '';
                    $booking['customer_address'] = $customerData['address'] ?? '';
                }
            }
            
            if ($booking['vehicle_data']) {
                $vehicleData = json_decode($booking['vehicle_data'], true);
                if ($vehicleData) {
                    $booking['vehicle_plate'] = $vehicleData['plate_number'] ?? '';
                    $booking['vehicle_model'] = $vehicleData['model'] ?? '';
                    $booking['vehicle_vin'] = $vehicleData['vin_number'] ?? '';
                    $booking['vehicle_year'] = $vehicleData['year'] ?? '';
                    $booking['vehicle_km'] = $vehicleData['current_km'] ?? '';
                }
            }
            
            Response::success($booking, 'Booking status updated successfully');
        } else {
            // Full update - require all fields
            Request::validateRequired($data, ['customer_id', 'vehicle_id', 'service_type_id', 'booking_date', 'booking_time', 'status']);

            // Get customer and vehicle data
            $customerStmt = $db->prepare("SELECT name, phone, email, address FROM customers WHERE id = ?");
            $customerStmt->execute([$data['customer_id']]);
            $customer = $customerStmt->fetch(PDO::FETCH_ASSOC);

            if (!$customer) {
                Response::error('Customer not found', 404);
            }

            $vehicleStmt = $db->prepare("SELECT plate_number, model, vin_number, year, current_km, customer_id FROM vehicles WHERE id = ?");
            $vehicleStmt->execute([$data['vehicle_id']]);
            $vehicle = $vehicleStmt->fetch(PDO::FETCH_ASSOC);

            if (!$vehicle) {
                Response::error('Vehicle not found', 404);
            }

            // Validate that the vehicle belongs to the selected customer
            if ($vehicle['customer_id'] != $data['customer_id']) {
                Response::error('Vehicle does not belong to the selected customer', 400);
            }

            // Validate service type exists
            $stmt = $db->prepare("SELECT id FROM service_types WHERE id = ?");
            $stmt->execute([$data['service_type_id']]);
            if (!$stmt->fetch()) {
                Response::error('Service type not found', 404);
            }

            // Check for conflicting bookings at the same time (excluding current booking)
            $stmt = $db->prepare("
                SELECT id FROM bookings
                WHERE booking_date = ? AND booking_time = ? AND status IN ('confirmed', 'in_progress') AND id != ?
            ");
            $stmt->execute([$data['booking_date'], $data['booking_time'], $bookingId]);
            if ($stmt->fetch()) {
                Response::error('Time slot already booked', 409);
            }

            // Prepare customer and vehicle data as JSON
            $customerData = json_encode([
                'name' => $customer['name'],
                'phone' => $customer['phone'],
                'email' => $customer['email'],
                'address' => $customer['address']
            ]);

            $vehicleData = json_encode([
                'plate_number' => $vehicle['plate_number'],
                'model' => $vehicle['model'],
                'vin_number' => $vehicle['vin_number'],
                'year' => $vehicle['year'],
                'current_km' => $vehicle['current_km']
            ]);

            $stmt = $db->prepare("
                UPDATE bookings
                SET customer_data = ?, vehicle_data = ?, service_type_id = ?, booking_date = ?, booking_time = ?, status = ?, notes = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([
                $customerData,
                $vehicleData,
                $data['service_type_id'],
                $data['booking_date'],
                $data['booking_time'],
                $data['status'],
                $data['notes'] ?? null,
                $bookingId
            ]);

            Response::success(null, 'Booking updated successfully');
        }

    } elseif ($method === 'DELETE') {
        // Delete booking
        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        $segments = array_filter($segments);
        $segments = array_values($segments);

        $bookingId = null;
        if (isset($segments[2]) && is_numeric($segments[2])) {
            $bookingId = $segments[2];
        }

        if (!$bookingId) {
            Response::error('Booking ID is required', 400);
        }

        $stmt = $db->prepare("DELETE FROM bookings WHERE id = ?");
        $stmt->execute([$bookingId]);

        Response::success(null, 'Booking deleted successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Bookings API error: " . $e->getMessage());
    Response::error('Failed to process bookings request', 500);
}
?>
