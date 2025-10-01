<?php
/**
 * Services API - Simplified Version
 * GTV Motor PHP Backend
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
            // Check if requesting invoice
            $isInvoiceRequest = isset($segments[3]) && $segments[3] === 'invoice';

            if ($isInvoiceRequest) {
                // Get service with invoice data including service items
                $stmt = $db->prepare("
                    SELECT
                        s.*,
                        c.name as customer_name,
                        c.phone as customer_phone,
                        c.address as customer_address,
                        v.plate_number as vehicle_plate,
                        v.model as vehicle_model,
                        v.year as vehicle_year,
                        v.vin_number as vehicle_vin_number,
                        vm.name as vehicle_model_name,
                        vm.category as vehicle_model_category,
                        st.service_type_name
                    FROM services s
                    LEFT JOIN customers c ON s.customer_id = c.id
                    LEFT JOIN vehicles v ON s.vehicle_id = v.id
                    LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                    LEFT JOIN service_types st ON s.service_type_id = st.id
                    WHERE s.id = ?
                ");
                $stmt->execute([$serviceId]);
                $service = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$service) {
                    Response::error('Service not found', 404);
                }

                // Get service items for this service
                $itemsStmt = $db->prepare("
                    SELECT
                        si.*,
                        si.description,
                        si.quantity,
                        si.unit_price,
                        si.total_price,
                        si.item_type
                    FROM service_items si
                    WHERE si.service_id = ?
                    ORDER BY si.id
                ");
                $itemsStmt->execute([$serviceId]);
                $serviceItems = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

                // If no service items found, create a default item from service data
                if (empty($serviceItems)) {
                    $serviceItems = [
                        [
                            'id' => 1,
                            'description' => $service['service_type_name'] ?: 'Service',
                            'quantity' => 1,
                            'unit_price' => $service['total_amount'],
                            'total_price' => $service['total_amount'],
                            'item_type' => 'service'
                        ]
                    ];
                }

                // Format invoice response
                $invoiceData = [
                    'service' => $service,
                    'invoice' => [
                        'items' => $serviceItems,
                        'subtotal' => $service['total_amount'],
                        'vat_rate' => 10,
                        'vat_amount' => round($service['total_amount'] * 0.1, 2),
                        'total' => round($service['total_amount'] * 1.1, 2)
                    ]
                ];

                Response::success($invoiceData, 'Service invoice retrieved successfully');
                return;
            } else {
                // Get individual service by ID
                $stmt = $db->prepare("
                    SELECT
                        s.*,
                        c.name as customer_name,
                        c.phone as customer_phone,
                        v.plate_number as vehicle_plate,
                        vm.name as vehicle_model_name,
                        vm.category as vehicle_model_category,
                        st.service_type_name
                    FROM services s
                    LEFT JOIN customers c ON s.customer_id = c.id
                    LEFT JOIN vehicles v ON s.vehicle_id = v.id
                    LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                    LEFT JOIN service_types st ON s.service_type_id = st.id
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
        }

        // Get services with pagination and search
        $pagination = Request::getPagination();
        $search = Request::getSearch();
        $customerId = Request::query('customer_id');
        $vehicleId = Request::query('vehicle_id');

        $where = [];
        $params = [];

        if (!empty($search['search'])) {
            $where[] = "(s.invoice_number LIKE ? OR s.notes LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR v.plate_number LIKE ? OR vm.name LIKE ?)";
            $searchTerm = '%' . $search['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
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
                v.plate_number as vehicle_plate,
                vm.name as vehicle_model_name,
                vm.category as vehicle_model_category,
                st.service_type_name
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            LEFT JOIN service_types st ON s.service_type_id = st.id
            {$whereClause}
            ORDER BY s.{$search['sortBy']} {$search['sortOrder']}
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $countQuery = "
            SELECT COUNT(*) as total
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
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
        Request::validateRequired($data, ['customer_id', 'vehicle_id', 'service_type_id']);

        $customerId = (int)$data['customer_id'];
        $vehicleId = (int)$data['vehicle_id'];
        $serviceTypeId = (int)$data['service_type_id'];
        $serviceDate = $data['service_date'] ?? date('Y-m-d');
        $totalAmount = isset($data['total_amount']) ? (float)$data['total_amount'] : 0.00;
        $serviceStatus = Request::sanitize($data['service_status'] ?? 'pending');
        $paymentMethod = Request::sanitize($data['payment_method'] ?? 'cash');
        $paymentStatus = Request::sanitize($data['payment_status'] ?? 'pending');
        $notes = Request::sanitize($data['notes'] ?? '');
        $serviceDetail = Request::sanitize($data['service_detail'] ?? '');

        // Generate invoice number
        $year = date('y');
        $month = date('m');
        $day = date('d');
        $random = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
        $invoiceNumber = "INV-{$year}{$month}{$day}-{$random}";

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
            INSERT INTO services (
                invoice_number, customer_id, vehicle_id, service_type_id, service_date,
                total_amount, payment_method, payment_status, service_status, notes, service_detail,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $invoiceNumber, $customerId, $vehicleId, $serviceTypeId, $serviceDate,
            $totalAmount, $paymentMethod, $paymentStatus, $serviceStatus, $notes, $serviceDetail
        ]);

        $serviceId = $db->lastInsertId();

        // Get the created service
        $stmt = $db->prepare("
            SELECT s.*, c.name as customer_name, c.phone as customer_phone,
                   v.plate_number as vehicle_plate, vm.name as vehicle_model_name
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            WHERE s.id = ?
        ");
        $stmt->execute([$serviceId]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::created($service, 'Service created successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Services API error: " . $e->getMessage());
    Response::error('Failed to process services request', 500);
}
?>