<?php
/**
 * Services API
 * GTV Motor PHP Backend - Updated for Token Authentication
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Request.php';
require_once __DIR__ . '/../includes/Response.php';

function generateInvoiceNumber() {
    $year = date('y');
    $month = date('m');
    $day = date('d');
    $random = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
    return "INV-{$year}{$month}{$day}-{$random}";
}

try {
    // No authentication required - Developer Mode
    require_once __DIR__ . '/../config/database.php';
    $database = new Database();
    $db = $database->getConnection();

    $method = Request::method();

    if ($method === 'GET') {
        // Check if requesting individual service
        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        $segments = array_filter($segments);
        $segments = array_values($segments);

        $serviceId = null;
        if (isset($segments[2]) && is_numeric($segments[2])) {
            $serviceId = $segments[2];
        }

        if ($serviceId && is_numeric($serviceId)) {
            // Get individual service by ID
            $stmt = $db->prepare("
                SELECT
                    s.*,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    c.email as customer_email,
                    c.address as customer_address,
                    v.plate_number as vehicle_plate,
                    v.model as vehicle_model,
                    v.vin_number as vehicle_vin,
                    v.year as vehicle_year,
                    v.current_km,
                    st.service_type_name,
                    tech.name as technician_name,
                    tech.phone as technician_phone,
                    sales.name as sales_rep_name,
                    sales.phone as sales_rep_phone
                FROM services s
                LEFT JOIN customers c ON s.customer_id = c.id
                LEFT JOIN vehicles v ON s.vehicle_id = v.id
                LEFT JOIN service_types st ON s.service_type_id = st.id
                LEFT JOIN staff tech ON s.technician_id = tech.id
                LEFT JOIN staff sales ON s.sales_rep_id = sales.id
                WHERE s.id = ?
            ");
            $stmt->execute([$serviceId]);
            $service = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$service) {
                Response::error('Service not found', 404);
            }

            Response::success($service, 'Service retrieved successfully');
            return;
        }

        // Get services with pagination and search
        $pagination = Request::getPagination();
        $search = Request::getSearch();
        $status = Request::query('status');
        $customerId = Request::query('customer_id');
        $vehicleId = Request::query('vehicle_id');

        $where = [];
        $params = [];

        if (!empty($search['search'])) {
            $where[] = "(s.invoice_number LIKE ? OR c.name LIKE ? OR v.plate_number LIKE ? OR st.service_type_name LIKE ?)";
            $searchTerm = '%' . $search['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        if ($status) {
            $where[] = "s.service_status = ?";
            $params[] = $status;
        }

        if ($customerId) {
            $where[] = "s.customer_id = ?";
            $params[] = $customerId;
        }

        if ($vehicleId) {
            $where[] = "s.vehicle_id = ?";
            $params[] = $vehicleId;
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $query = "
            SELECT
                s.*,
                c.name as customer_name,
                c.phone as customer_phone,
                c.email as customer_email,
                v.plate_number as vehicle_plate,
                v.model as vehicle_model,
                v.vin_number as vehicle_vin,
                v.year as vehicle_year,
                st.service_type_name,
                tech.name as technician_name,
                sales.name as sales_rep_name
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN service_types st ON s.service_type_id = st.id
            LEFT JOIN staff tech ON s.technician_id = tech.id
            LEFT JOIN staff sales ON s.sales_rep_id = sales.id
            {$whereClause}
            ORDER BY s.{$search['sortBy']} {$search['sortOrder']}
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";

        $services = $db->prepare($query);
        $services->execute($params);
        $services = $services->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $countQuery = "
            SELECT COUNT(s.id) as total
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN service_types st ON s.service_type_id = st.id
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

        Response::paginated($services, $paginationData, 'Services retrieved successfully');

    } elseif ($method === 'POST') {
        // Create new service
        $data = Request::body();
        Request::validateRequired($data, ['customer_id', 'vehicle_id', 'service_type_id', 'service_date']);

        $customerId = (int)$data['customer_id'];
        $vehicleId = (int)$data['vehicle_id'];
        $serviceTypeId = (int)$data['service_type_id'];
        $serviceDate = $data['service_date'];
        $currentKm = !empty($data['current_km']) ? (int)$data['current_km'] : null;
        $nextServiceKm = !empty($data['next_service_km']) ? (int)$data['next_service_km'] : null;
        $nextServiceDate = $data['next_service_date'] ?? null;
        $totalAmount = !empty($data['total_amount']) ? (float)$data['total_amount'] : 0;
        $serviceCost = !empty($data['service_cost']) ? (float)$data['service_cost'] : $totalAmount;
        $paymentMethod = $data['payment_method'] ?? 'cash';
        $paymentStatus = $data['payment_status'] ?? 'pending';
        $serviceStatus = $data['service_status'] ?? 'pending';
        $notes = Request::sanitize($data['notes'] ?? '');
        $technicianId = !empty($data['technician_id']) ? (int)$data['technician_id'] : null;
        $salesRepId = !empty($data['sales_rep_id']) ? (int)$data['sales_rep_id'] : null;

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

        // Validate service type exists
        $stmt = $db->prepare("SELECT id FROM service_types WHERE id = ?");
        $stmt->execute([$serviceTypeId]);
        if (!$stmt->fetch()) {
            Response::error('Service type not found', 404);
        }

        // Generate invoice number
        $invoiceNumber = generateInvoiceNumber();

        // Ensure invoice number is unique
        do {
            $stmt = $db->prepare("SELECT id FROM services WHERE invoice_number = ?");
            $stmt->execute([$invoiceNumber]);
            if ($stmt->fetch()) {
                $invoiceNumber = generateInvoiceNumber();
            } else {
                break;
            }
        } while (true);

        $db->beginTransaction();

        try {
            // Create service
            $stmt = $db->prepare("
                INSERT INTO services (
                    invoice_number, customer_id, vehicle_id, service_type_id, service_date,
                    current_km, next_service_km, next_service_date, total_amount, service_cost,
                    payment_method, payment_status, service_status, notes, technician_id, sales_rep_id,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");

            $stmt->execute([
                $invoiceNumber, $customerId, $vehicleId, $serviceTypeId, $serviceDate,
                $currentKm, $nextServiceKm, $nextServiceDate, $totalAmount, $serviceCost,
                $paymentMethod, $paymentStatus, $serviceStatus, $notes, $technicianId, $salesRepId
            ]);

            $serviceId = $db->lastInsertId();

            // Create service items if provided
            if (!empty($data['service_items']) && is_array($data['service_items'])) {
                foreach ($data['service_items'] as $item) {
                    $description = Request::sanitize($item['description']);
                    $quantity = (float)($item['quantity'] ?? 1);
                    $unitPrice = (float)($item['unit_price'] ?? 0);
                    $totalPrice = $quantity * $unitPrice;
                    $itemType = $item['item_type'] ?? 'part';

                    $stmt = $db->prepare("
                        INSERT INTO service_items (service_id, description, quantity, unit_price, total_price, item_type, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, NOW())
                    ");
                    $stmt->execute([$serviceId, $description, $quantity, $unitPrice, $totalPrice, $itemType]);
                }
            }

            $db->commit();

            // Get created service with details
            $stmt = $db->prepare("
                SELECT
                    s.*,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    v.plate_number as vehicle_plate,
                    v.model as vehicle_model,
                    st.service_type_name,
                    tech.name as technician_name,
                    sales.name as sales_rep_name
                FROM services s
                LEFT JOIN customers c ON s.customer_id = c.id
                LEFT JOIN vehicles v ON s.vehicle_id = v.id
                LEFT JOIN service_types st ON s.service_type_id = st.id
                LEFT JOIN staff tech ON s.technician_id = tech.id
                LEFT JOIN staff sales ON s.sales_rep_id = sales.id
                WHERE s.id = ?
            ");
            $stmt->execute([$serviceId]);
            $service = $stmt->fetch(PDO::FETCH_ASSOC);

            Response::created($service, 'Service created successfully');

        } catch (Exception $e) {
            $db->rollback();
            throw $e;
        }

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Services API error: " . $e->getMessage());
    Response::error('Failed to process services request', 500);
}
?>
