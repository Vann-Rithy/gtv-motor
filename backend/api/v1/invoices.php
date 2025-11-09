<?php
/**
 * Service Invoices API v1
 * GTV Motor PHP Backend - Complete Service Invoice Information
 * Endpoint: api.gtvmotor.dev/v1/invoices
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/Request.php';
require_once __DIR__ . '/../../includes/Response.php';
require_once __DIR__ . '/middleware/ApiAuth.php';

try {
    // Validate API Key
    $keyConfig = ApiAuth::validateApiKey();

    // Check read permission
    if (!ApiAuth::hasPermission($keyConfig, 'read')) {
        Response::forbidden('API key does not have read permission.');
    }

    // Initialize database
    $database = new Database();
    $db = $database->getConnection();

    $method = Request::method();

    if ($method === 'GET') {
        // Get URI segments
        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        $segments = array_filter($segments);
        $segments = array_values($segments);

        $invoiceId = null;
        if (isset($segments[2]) && is_numeric($segments[2])) {
            $invoiceId = $segments[2];
        }

        // Check if requesting by invoice number
        $invoiceNumber = Request::query('invoice_number');

        if ($invoiceNumber) {
            $invoiceId = null; // Reset to use invoice number search
        }

        if ($invoiceId && is_numeric($invoiceId)) {
            // Get individual service invoice with complete information
            $stmt = $db->prepare("
                SELECT
                    s.id,
                    s.invoice_number,
                    s.service_date,
                    s.current_km,
                    s.next_service_km,
                    s.next_service_date,
                    s.volume_l,
                    s.total_amount,
                    s.service_cost,
                    s.payment_method,
                    s.payment_status,
                    s.service_status,
                    s.notes,
                    s.service_detail,
                    s.exchange_rate,
                    s.total_khr,
                    s.customer_type,
                    s.booking_id,
                    s.created_at,
                    s.updated_at,
                    c.id as customer_id,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    c.email as customer_email,
                    c.address as customer_address,
                    v.id as vehicle_id,
                    v.plate_number as vehicle_plate,
                    v.vin_number as vehicle_vin,
                    v.year as vehicle_year,
                    v.current_km as vehicle_current_km,
                    vm.id as vehicle_model_id,
                    vm.name as vehicle_model_name,
                    vm.category as vehicle_model_category,
                    st.id as service_type_id,
                    st.service_type_name,
                    st.category as service_category,
                    tech.id as technician_id,
                    tech.name as technician_name,
                    sales.id as sales_rep_id,
                    sales.name as sales_rep_name
                FROM services s
                LEFT JOIN customers c ON s.customer_id = c.id
                LEFT JOIN vehicles v ON s.vehicle_id = v.id
                LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                LEFT JOIN service_types st ON s.service_type_id = st.id
                LEFT JOIN staff tech ON s.technician_id = tech.id
                LEFT JOIN staff sales ON s.sales_rep_id = sales.id
                WHERE s.id = ?
            ");
            $stmt->execute([$invoiceId]);
            $service = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$service) {
                Response::notFound('Service invoice not found');
            }

            // Get service items
            $itemsStmt = $db->prepare("
                SELECT
                    si.id,
                    si.description,
                    si.quantity,
                    si.unit_price,
                    si.total_price,
                    si.item_type,
                    si.inventory_item_id
                FROM service_items si
                WHERE si.service_id = ?
                ORDER BY si.id
            ");
            $itemsStmt->execute([$invoiceId]);
            $serviceItems = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

            // Calculate invoice totals
            $subtotal = $service['total_amount'];
            $vatRate = 10.00; // Default VAT rate
            $vatAmount = round($subtotal * ($vatRate / 100), 2);
            $total = round($subtotal + $vatAmount, 2);

            // If service items exist, recalculate from items
            if (!empty($serviceItems)) {
                $subtotal = 0;
                foreach ($serviceItems as $item) {
                    $subtotal += $item['total_price'];
                }
                $vatAmount = round($subtotal * ($vatRate / 100), 2);
                $total = round($subtotal + $vatAmount, 2);
            }

            // Build complete invoice response
            $invoice = [
                'service' => $service,
                'invoice_number' => $service['invoice_number'],
                'invoice_date' => $service['service_date'],
                'customer' => [
                    'id' => $service['customer_id'],
                    'name' => $service['customer_name'],
                    'phone' => $service['customer_phone'],
                    'email' => $service['customer_email'],
                    'address' => $service['customer_address']
                ],
                'vehicle' => [
                    'id' => $service['vehicle_id'],
                    'plate_number' => $service['vehicle_plate'],
                    'vin_number' => $service['vehicle_vin'],
                    'year' => $service['vehicle_year'],
                    'current_km' => $service['vehicle_current_km'],
                    'model' => [
                        'id' => $service['vehicle_model_id'],
                        'name' => $service['vehicle_model_name'],
                        'category' => $service['vehicle_model_category']
                    ]
                ],
                'service_type' => [
                    'id' => $service['service_type_id'],
                    'name' => $service['service_type_name'],
                    'category' => $service['service_category']
                ],
                'staff' => [
                    'technician' => [
                        'id' => $service['technician_id'],
                        'name' => $service['technician_name']
                    ],
                    'sales_rep' => [
                        'id' => $service['sales_rep_id'],
                        'name' => $service['sales_rep_name']
                    ]
                ],
                'items' => $serviceItems,
                'totals' => [
                    'subtotal' => $subtotal,
                    'vat_rate' => $vatRate,
                    'vat_amount' => $vatAmount,
                    'total' => $total,
                    'exchange_rate' => $service['exchange_rate'] ?? 0,
                    'total_khr' => $service['total_khr'] ?? ($total * ($service['exchange_rate'] ?? 0))
                ],
                'payment' => [
                    'method' => $service['payment_method'],
                    'status' => $service['payment_status']
                ],
                'status' => [
                    'service_status' => $service['service_status'],
                    'payment_status' => $service['payment_status']
                ],
                'notes' => $service['notes'],
                'service_detail' => $service['service_detail'],
                'created_at' => $service['created_at'],
                'updated_at' => $service['updated_at']
            ];

            Response::success($invoice, 'Service invoice retrieved successfully');
            return;
        }

        if ($invoiceNumber) {
            // Get invoice by invoice number
            $stmt = $db->prepare("
                SELECT
                    s.id,
                    s.invoice_number,
                    s.service_date,
                    s.total_amount,
                    s.payment_status,
                    s.service_status,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    v.plate_number as vehicle_plate,
                    vm.name as vehicle_model_name
                FROM services s
                LEFT JOIN customers c ON s.customer_id = c.id
                LEFT JOIN vehicles v ON s.vehicle_id = v.id
                LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                WHERE s.invoice_number = ?
                ORDER BY s.id DESC
                LIMIT 1
            ");
            $stmt->execute([$invoiceNumber]);
            $service = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$service) {
                Response::notFound('Service invoice not found');
            }

            Response::success($service, 'Service invoice retrieved successfully');
            return;
        }

        // Get invoices list with pagination
        $pagination = Request::getPagination();
        $search = Request::getSearch();
        $customerId = Request::query('customer_id');
        $vehicleId = Request::query('vehicle_id');
        $startDate = Request::query('start_date');
        $endDate = Request::query('end_date');

        $where = [];
        $params = [];

        if (!empty($search['search'])) {
            $where[] = "(s.invoice_number LIKE ? OR s.notes LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR v.plate_number LIKE ?)";
            $searchTerm = '%' . $search['search'] . '%';
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

        if ($startDate) {
            $where[] = "s.service_date >= ?";
            $params[] = $startDate;
        }

        if ($endDate) {
            $where[] = "s.service_date <= ?";
            $params[] = $endDate;
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $query = "
            SELECT
                s.id,
                s.invoice_number,
                s.service_date,
                s.total_amount,
                s.payment_method,
                s.payment_status,
                s.service_status,
                c.name as customer_name,
                c.phone as customer_phone,
                v.plate_number as vehicle_plate,
                vm.name as vehicle_model_name,
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
        $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

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

        Response::paginated($invoices, $paginationData, 'Service invoices retrieved successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("API v1 Invoices error: " . $e->getMessage());
    Response::error('Failed to process request', 500);
}
?>

