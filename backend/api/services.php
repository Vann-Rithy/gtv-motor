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
                // Get individual service by ID with complete information
                $stmt = $db->prepare("
                    SELECT
                        s.*,
                        c.name as customer_name,
                        c.phone as customer_phone,
                        c.address as customer_address,
                        v.plate_number as vehicle_plate,
                        v.year as vehicle_year,
                        v.vin_number as vehicle_vin_number,
                        vm.name as vehicle_model_name,
                        vm.category as vehicle_model_category,
                        st.service_type_name,
                        st.category as service_category,
                        tech.name as technician_name,
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

                // Add service items to the response
                $service['service_items'] = $serviceItems;

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
        $currentKm = isset($data['current_km']) ? (int)$data['current_km'] : null;
        $nextServiceKm = isset($data['next_service_km']) ? (int)$data['next_service_km'] : null;
        $nextServiceDate = $data['next_service_date'] ?? null;
        $technicianId = isset($data['technician_id']) ? (int)$data['technician_id'] : null;
        $salesRepId = isset($data['sales_rep_id']) ? (int)$data['sales_rep_id'] : null;
        $customerType = Request::sanitize($data['customer_type'] ?? 'walking');
        $bookingId = isset($data['booking_id']) ? (int)$data['booking_id'] : null;
        
        // Invoice and discount fields
        $discountAmount = isset($data['discount_amount']) ? (float)$data['discount_amount'] : 0.00;
        $discountType = Request::sanitize($data['discount_type'] ?? 'percentage');
        $discountValue = isset($data['discount_value']) ? (float)$data['discount_value'] : 0.00;
        $vatRate = isset($data['vat_rate']) ? (float)$data['vat_rate'] : 10.00;
        $vatAmount = isset($data['vat_amount']) ? (float)$data['vat_amount'] : 0.00;
        $subtotal = isset($data['subtotal']) ? (float)$data['subtotal'] : $totalAmount;

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
                current_km, next_service_km, next_service_date, total_amount, payment_method, 
                payment_status, service_status, notes, service_detail, technician_id, 
                sales_rep_id, customer_type, booking_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $invoiceNumber, $customerId, $vehicleId, $serviceTypeId, $serviceDate,
            $currentKm, $nextServiceKm, $nextServiceDate, $totalAmount, $paymentMethod,
            $paymentStatus, $serviceStatus, $notes, $serviceDetail, $technicianId,
            $salesRepId, $customerType, $bookingId
        ]);

        $serviceId = $db->lastInsertId();

        // Get the created service with complete information
        $stmt = $db->prepare("
            SELECT s.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
                   v.plate_number as vehicle_plate, v.year as vehicle_year, v.vin_number as vehicle_vin_number,
                   vm.name as vehicle_model_name, vm.category as vehicle_model_category,
                   st.service_type_name, st.category as service_category,
                   tech.name as technician_name, sales.name as sales_rep_name
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            LEFT JOIN service_types st ON s.service_type_id = st.id
            LEFT JOIN staff tech ON s.technician_id = tech.id
            LEFT JOIN staff sales ON s.sales_rep_id = sales.id
            WHERE s.id = ?
        ");
        $stmt->execute([$serviceId]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::created($service, 'Service created successfully');

    } elseif ($method === 'PUT') {
        // Update existing service
        $serviceId = (int)$pathParts[1];
        $data = Request::body();

        // Validate service exists
        $stmt = $db->prepare("SELECT id FROM services WHERE id = ?");
        $stmt->execute([$serviceId]);
        if (!$stmt->fetch()) {
            Response::error('Service not found', 404);
        }

        // Build dynamic UPDATE query based on provided fields
        $updateFields = [];
        $updateValues = [];

        if (isset($data['payment_status'])) {
            $updateFields[] = "payment_status = ?";
            $updateValues[] = Request::sanitize($data['payment_status']);
            
            // Auto-update service status based on payment status
            if ($data['payment_status'] === 'paid') {
                $updateFields[] = "service_status = ?";
                $updateValues[] = 'completed';
            } elseif ($data['payment_status'] === 'cancelled') {
                $updateFields[] = "service_status = ?";
                $updateValues[] = 'cancelled';
            }
        }

        if (isset($data['service_status'])) {
            $updateFields[] = "service_status = ?";
            $updateValues[] = Request::sanitize($data['service_status']);
        }

        if (isset($data['payment_method'])) {
            $updateFields[] = "payment_method = ?";
            $updateValues[] = Request::sanitize($data['payment_method']);
        }

        if (isset($data['total_amount'])) {
            $updateFields[] = "total_amount = ?";
            $updateValues[] = (float)$data['total_amount'];
        }

        if (isset($data['notes'])) {
            $updateFields[] = "notes = ?";
            $updateValues[] = Request::sanitize($data['notes']);
        }

        if (isset($data['service_detail'])) {
            $updateFields[] = "service_detail = ?";
            $updateValues[] = Request::sanitize($data['service_detail']);
        }

        if (isset($data['current_km'])) {
            $updateFields[] = "current_km = ?";
            $updateValues[] = isset($data['current_km']) ? (int)$data['current_km'] : null;
        }

        if (isset($data['next_service_km'])) {
            $updateFields[] = "next_service_km = ?";
            $updateValues[] = isset($data['next_service_km']) ? (int)$data['next_service_km'] : null;
        }

        if (isset($data['next_service_date'])) {
            $updateFields[] = "next_service_date = ?";
            $updateValues[] = $data['next_service_date'] ?? null;
        }

        if (isset($data['technician_id'])) {
            $updateFields[] = "technician_id = ?";
            $updateValues[] = isset($data['technician_id']) ? (int)$data['technician_id'] : null;
        }

        if (isset($data['sales_rep_id'])) {
            $updateFields[] = "sales_rep_id = ?";
            $updateValues[] = isset($data['sales_rep_id']) ? (int)$data['sales_rep_id'] : null;
        }

        // Always update the updated_at timestamp
        $updateFields[] = "updated_at = NOW()";

        if (empty($updateFields)) {
            Response::error('No fields to update', 400);
        }

        $updateValues[] = $serviceId; // Add service ID for WHERE clause

        $updateQuery = "UPDATE services SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $db->prepare($updateQuery);
        $stmt->execute($updateValues);

        // Get the updated service with complete information
        $stmt = $db->prepare("
            SELECT s.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
                   v.plate_number as vehicle_plate, v.year as vehicle_year, v.vin_number as vehicle_vin_number,
                   vm.name as vehicle_model_name, vm.category as vehicle_model_category,
                   st.service_type_name, st.category as service_category,
                   tech.name as technician_name, sales.name as sales_rep_name
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            LEFT JOIN service_types st ON s.service_type_id = st.id
            LEFT JOIN staff tech ON s.technician_id = tech.id
            LEFT JOIN staff sales ON s.sales_rep_id = sales.id
            WHERE s.id = ?
        ");
        $stmt->execute([$serviceId]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::success($service, 'Service updated successfully');

    } elseif ($method === 'PATCH') {
        // Update existing service (alternative method)
        $serviceId = (int)$pathParts[1];
        $data = Request::body();

        // Validate service exists
        $stmt = $db->prepare("SELECT id FROM services WHERE id = ?");
        $stmt->execute([$serviceId]);
        if (!$stmt->fetch()) {
            Response::error('Service not found', 404);
        }

        // Build dynamic UPDATE query based on provided fields
        $updateFields = [];
        $updateValues = [];

        if (isset($data['payment_status'])) {
            $updateFields[] = "payment_status = ?";
            $updateValues[] = Request::sanitize($data['payment_status']);
            
            // Auto-update service status based on payment status
            if ($data['payment_status'] === 'paid') {
                $updateFields[] = "service_status = ?";
                $updateValues[] = 'completed';
            } elseif ($data['payment_status'] === 'cancelled') {
                $updateFields[] = "service_status = ?";
                $updateValues[] = 'cancelled';
            }
        }

        if (isset($data['service_status'])) {
            $updateFields[] = "service_status = ?";
            $updateValues[] = Request::sanitize($data['service_status']);
        }

        if (isset($data['payment_method'])) {
            $updateFields[] = "payment_method = ?";
            $updateValues[] = Request::sanitize($data['payment_method']);
        }

        if (isset($data['total_amount'])) {
            $updateFields[] = "total_amount = ?";
            $updateValues[] = (float)$data['total_amount'];
        }

        if (isset($data['notes'])) {
            $updateFields[] = "notes = ?";
            $updateValues[] = Request::sanitize($data['notes']);
        }

        if (isset($data['service_detail'])) {
            $updateFields[] = "service_detail = ?";
            $updateValues[] = Request::sanitize($data['service_detail']);
        }

        if (isset($data['current_km'])) {
            $updateFields[] = "current_km = ?";
            $updateValues[] = isset($data['current_km']) ? (int)$data['current_km'] : null;
        }

        if (isset($data['next_service_km'])) {
            $updateFields[] = "next_service_km = ?";
            $updateValues[] = isset($data['next_service_km']) ? (int)$data['next_service_km'] : null;
        }

        if (isset($data['next_service_date'])) {
            $updateFields[] = "next_service_date = ?";
            $updateValues[] = $data['next_service_date'] ?? null;
        }

        if (isset($data['technician_id'])) {
            $updateFields[] = "technician_id = ?";
            $updateValues[] = isset($data['technician_id']) ? (int)$data['technician_id'] : null;
        }

        if (isset($data['sales_rep_id'])) {
            $updateFields[] = "sales_rep_id = ?";
            $updateValues[] = isset($data['sales_rep_id']) ? (int)$data['sales_rep_id'] : null;
        }

        // Always update the updated_at timestamp
        $updateFields[] = "updated_at = NOW()";

        if (empty($updateFields)) {
            Response::error('No fields to update', 400);
        }

        $updateValues[] = $serviceId; // Add service ID for WHERE clause

        $updateQuery = "UPDATE services SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $db->prepare($updateQuery);
        $stmt->execute($updateValues);

        // Get the updated service with complete information
        $stmt = $db->prepare("
            SELECT s.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
                   v.plate_number as vehicle_plate, v.year as vehicle_year, v.vin_number as vehicle_vin_number,
                   vm.name as vehicle_model_name, vm.category as vehicle_model_category,
                   st.service_type_name, st.category as service_category,
                   tech.name as technician_name, sales.name as sales_rep_name
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
            LEFT JOIN service_types st ON s.service_type_id = st.id
            LEFT JOIN staff tech ON s.technician_id = tech.id
            LEFT JOIN staff sales ON s.sales_rep_id = sales.id
            WHERE s.id = ?
        ");
        $stmt->execute([$serviceId]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::success($service, 'Service updated successfully');

    } elseif ($method === 'POST') {
        $data = Request::body();
        
        // Check if this is an update request via action parameter in body
        if (isset($data['action']) && $data['action'] === 'update' && isset($data['service_id'])) {
            // Update existing service via POST with action=update
            $serviceId = (int)$data['service_id'];
            
            // Validate service exists
            $stmt = $db->prepare("SELECT id FROM services WHERE id = ?");
            $stmt->execute([$serviceId]);
            if (!$stmt->fetch()) {
                Response::error('Service not found', 404);
            }
            
            // Build dynamic UPDATE query based on provided fields
            $updateFields = [];
            $updateValues = [];
            
            if (isset($data['payment_status'])) {
                $updateFields[] = "payment_status = ?";
                $updateValues[] = Request::sanitize($data['payment_status']);
                
                // Auto-update service status based on payment status
                if ($data['payment_status'] === 'paid') {
                    $updateFields[] = "service_status = ?";
                    $updateValues[] = 'completed';
                } elseif ($data['payment_status'] === 'cancelled') {
                    $updateFields[] = "service_status = ?";
                    $updateValues[] = 'cancelled';
                }
            }
            
            if (isset($data['service_status'])) {
                $updateFields[] = "service_status = ?";
                $updateValues[] = Request::sanitize($data['service_status']);
            }
            
            if (isset($data['payment_method'])) {
                $updateFields[] = "payment_method = ?";
                $updateValues[] = Request::sanitize($data['payment_method']);
            }
            
            if (isset($data['total_amount'])) {
                $updateFields[] = "total_amount = ?";
                $updateValues[] = (float)$data['total_amount'];
            }
            
            if (isset($data['notes'])) {
                $updateFields[] = "notes = ?";
                $updateValues[] = Request::sanitize($data['notes']);
            }
            
            if (isset($data['service_detail'])) {
                $updateFields[] = "service_detail = ?";
                $updateValues[] = Request::sanitize($data['service_detail']);
            }
            
            if (isset($data['current_km'])) {
                $updateFields[] = "current_km = ?";
                $updateValues[] = isset($data['current_km']) ? (int)$data['current_km'] : null;
            }
            
            if (isset($data['next_service_km'])) {
                $updateFields[] = "next_service_km = ?";
                $updateValues[] = isset($data['next_service_km']) ? (int)$data['next_service_km'] : null;
            }
            
            if (isset($data['next_service_date'])) {
                $updateFields[] = "next_service_date = ?";
                $updateValues[] = $data['next_service_date'] ?? null;
            }
            
            if (isset($data['technician_id'])) {
                $updateFields[] = "technician_id = ?";
                $updateValues[] = isset($data['technician_id']) ? (int)$data['technician_id'] : null;
            }
            
            if (isset($data['sales_rep_id'])) {
                $updateFields[] = "sales_rep_id = ?";
                $updateValues[] = isset($data['sales_rep_id']) ? (int)$data['sales_rep_id'] : null;
            }
            
            // Always update the updated_at timestamp
            $updateFields[] = "updated_at = NOW()";
            
            if (empty($updateFields)) {
                Response::error('No fields to update', 400);
            }
            
            $updateValues[] = $serviceId; // Add service ID for WHERE clause
            
            $updateQuery = "UPDATE services SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $db->prepare($updateQuery);
            $stmt->execute($updateValues);
            
            // Get the updated service with complete information
            $stmt = $db->prepare("
                SELECT s.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
                       v.plate_number as vehicle_plate, v.year as vehicle_year, v.vin_number as vehicle_vin_number,
                       vm.name as vehicle_model_name, vm.category as vehicle_model_category,
                       st.service_type_name, st.category as service_category,
                       tech.name as technician_name, sales.name as sales_rep_name
                FROM services s
                LEFT JOIN customers c ON s.customer_id = c.id
                LEFT JOIN vehicles v ON s.vehicle_id = v.id
                LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                LEFT JOIN service_types st ON s.service_type_id = st.id
                LEFT JOIN staff tech ON s.technician_id = tech.id
                LEFT JOIN staff sales ON s.sales_rep_id = sales.id
                WHERE s.id = ?
            ");
            $stmt->execute([$serviceId]);
            $service = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::success($service, 'Service updated successfully');
            
        } elseif (isset($_GET['action']) && $_GET['action'] === 'update' && isset($pathParts[1]) && is_numeric($pathParts[1])) {
            // Update existing service via POST /api/services/{id}?action=update
            $serviceId = (int)$pathParts[1];
            
            // Get update data from query parameters
            $updateFields = [];
            $updateValues = [];
            
            if (isset($_GET['payment_status'])) {
                $updateFields[] = "payment_status = ?";
                $updateValues[] = Request::sanitize($_GET['payment_status']);
                
                // Auto-update service status based on payment status
                if ($_GET['payment_status'] === 'paid') {
                    $updateFields[] = "service_status = ?";
                    $updateValues[] = 'completed';
                } elseif ($_GET['payment_status'] === 'cancelled') {
                    $updateFields[] = "service_status = ?";
                    $updateValues[] = 'cancelled';
                }
            }
            
            if (isset($_GET['service_status'])) {
                $updateFields[] = "service_status = ?";
                $updateValues[] = Request::sanitize($_GET['service_status']);
            }
            
            if (isset($_GET['payment_method'])) {
                $updateFields[] = "payment_method = ?";
                $updateValues[] = Request::sanitize($_GET['payment_method']);
            }
            
            if (isset($_GET['total_amount'])) {
                $updateFields[] = "total_amount = ?";
                $updateValues[] = (float)$_GET['total_amount'];
            }
            
            if (isset($_GET['notes'])) {
                $updateFields[] = "notes = ?";
                $updateValues[] = Request::sanitize($_GET['notes']);
            }
            
            if (isset($_GET['service_detail'])) {
                $updateFields[] = "service_detail = ?";
                $updateValues[] = Request::sanitize($_GET['service_detail']);
            }
            
            if (isset($_GET['current_km'])) {
                $updateFields[] = "current_km = ?";
                $updateValues[] = isset($_GET['current_km']) ? (int)$_GET['current_km'] : null;
            }
            
            if (isset($_GET['next_service_km'])) {
                $updateFields[] = "next_service_km = ?";
                $updateValues[] = isset($_GET['next_service_km']) ? (int)$_GET['next_service_km'] : null;
            }
            
            if (isset($_GET['next_service_date'])) {
                $updateFields[] = "next_service_date = ?";
                $updateValues[] = $_GET['next_service_date'] ?? null;
            }
            
            if (isset($_GET['technician_id'])) {
                $updateFields[] = "technician_id = ?";
                $updateValues[] = isset($_GET['technician_id']) ? (int)$_GET['technician_id'] : null;
            }
            
            if (isset($_GET['sales_rep_id'])) {
                $updateFields[] = "sales_rep_id = ?";
                $updateValues[] = isset($_GET['sales_rep_id']) ? (int)$_GET['sales_rep_id'] : null;
            }
            
            // Always update the updated_at timestamp
            $updateFields[] = "updated_at = NOW()";
            
            if (empty($updateFields)) {
                Response::error('No fields to update', 400);
            }
            
            $updateValues[] = $serviceId; // Add service ID for WHERE clause
            
            $updateQuery = "UPDATE services SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $db->prepare($updateQuery);
            $stmt->execute($updateValues);
            
            // Get the updated service with complete information
            $stmt = $db->prepare("
                SELECT s.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
                       v.plate_number as vehicle_plate, v.year as vehicle_year, v.vin_number as vehicle_vin_number,
                       vm.name as vehicle_model_name, vm.category as vehicle_model_category,
                       st.service_type_name, st.category as service_category,
                       tech.name as technician_name, sales.name as sales_rep_name
                FROM services s
                LEFT JOIN customers c ON s.customer_id = c.id
                LEFT JOIN vehicles v ON s.vehicle_id = v.id
                LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                LEFT JOIN service_types st ON s.service_type_id = st.id
                LEFT JOIN staff tech ON s.technician_id = tech.id
                LEFT JOIN staff sales ON s.sales_rep_id = sales.id
                WHERE s.id = ?
            ");
            $stmt->execute([$serviceId]);
            $service = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::success($service, 'Service updated successfully');
            
        } else {
            // Create new service (regular POST)
            $data = Request::body();
            
            // Skip validation if this is an update request
            if (!isset($data['action']) || $data['action'] !== 'update') {
                Request::validateRequired($data, ['customer_id', 'vehicle_id', 'service_type_id']);
            }
            
            // Handle update request in the else block as well
            if (isset($data['action']) && $data['action'] === 'update' && isset($data['service_id'])) {
                // Update existing service via POST with action=update
                $serviceId = (int)$data['service_id'];
                
                // Validate service exists
                $stmt = $db->prepare("SELECT id FROM services WHERE id = ?");
                $stmt->execute([$serviceId]);
                if (!$stmt->fetch()) {
                    Response::error('Service not found', 404);
                }
                
                // Build dynamic UPDATE query based on provided fields
                $updateFields = [];
                $updateValues = [];
                
                if (isset($data['payment_status'])) {
                    $updateFields[] = "payment_status = ?";
                    $updateValues[] = Request::sanitize($data['payment_status']);
                    
                    // Auto-update service status based on payment status
                    if ($data['payment_status'] === 'paid') {
                        $updateFields[] = "service_status = ?";
                        $updateValues[] = 'completed';
                    } elseif ($data['payment_status'] === 'cancelled') {
                        $updateFields[] = "service_status = ?";
                        $updateValues[] = 'cancelled';
                    }
                }
                
                if (isset($data['service_status'])) {
                    $updateFields[] = "service_status = ?";
                    $updateValues[] = Request::sanitize($data['service_status']);
                }
                
                if (isset($data['payment_method'])) {
                    $updateFields[] = "payment_method = ?";
                    $updateValues[] = Request::sanitize($data['payment_method']);
                }
                
                if (isset($data['total_amount'])) {
                    $updateFields[] = "total_amount = ?";
                    $updateValues[] = (float)$data['total_amount'];
                }
                
                if (isset($data['notes'])) {
                    $updateFields[] = "notes = ?";
                    $updateValues[] = Request::sanitize($data['notes']);
                }
                
                if (isset($data['service_detail'])) {
                    $updateFields[] = "service_detail = ?";
                    $updateValues[] = Request::sanitize($data['service_detail']);
                }
                
                if (isset($data['current_km'])) {
                    $updateFields[] = "current_km = ?";
                    $updateValues[] = isset($data['current_km']) ? (int)$data['current_km'] : null;
                }
                
                if (isset($data['next_service_km'])) {
                    $updateFields[] = "next_service_km = ?";
                    $updateValues[] = isset($data['next_service_km']) ? (int)$data['next_service_km'] : null;
                }
                
                if (isset($data['next_service_date'])) {
                    $updateFields[] = "next_service_date = ?";
                    $updateValues[] = $data['next_service_date'] ?? null;
                }
                
                if (isset($data['technician_id'])) {
                    $updateFields[] = "technician_id = ?";
                    $updateValues[] = isset($data['technician_id']) ? (int)$data['technician_id'] : null;
                }
                
                if (isset($data['sales_rep_id'])) {
                    $updateFields[] = "sales_rep_id = ?";
                    $updateValues[] = isset($data['sales_rep_id']) ? (int)$data['sales_rep_id'] : null;
                }
                
                // Always update the updated_at timestamp
                $updateFields[] = "updated_at = NOW()";
                
                if (empty($updateFields)) {
                    Response::error('No fields to update', 400);
                }
                
                $updateValues[] = $serviceId; // Add service ID for WHERE clause
                
                $updateQuery = "UPDATE services SET " . implode(', ', $updateFields) . " WHERE id = ?";
                $stmt = $db->prepare($updateQuery);
                $stmt->execute($updateValues);
                
                // Get the updated service with complete information
                $stmt = $db->prepare("
                    SELECT s.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
                           v.plate_number as vehicle_plate, v.year as vehicle_year, v.vin_number as vehicle_vin_number,
                           vm.name as vehicle_model_name, vm.category as vehicle_model_category,
                           st.service_type_name, st.category as service_category,
                           tech.name as technician_name, sales.name as sales_rep_name
                    FROM services s
                    LEFT JOIN customers c ON s.customer_id = c.id
                    LEFT JOIN vehicles v ON s.vehicle_id = v.id
                    LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                    LEFT JOIN service_types st ON s.service_type_id = st.id
                    LEFT JOIN staff tech ON s.technician_id = tech.id
                    LEFT JOIN staff sales ON s.sales_rep_id = sales.id
                    WHERE s.id = ?
                ");
                $stmt->execute([$serviceId]);
                $service = $stmt->fetch(PDO::FETCH_ASSOC);
                
                Response::success($service, 'Service updated successfully');
            } else {
                // Create new service (regular POST)
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
                $currentKm = isset($data['current_km']) ? (int)$data['current_km'] : null;
                $nextServiceKm = isset($data['next_service_km']) ? (int)$data['next_service_km'] : null;
                $nextServiceDate = $data['next_service_date'] ?? null;
                $technicianId = isset($data['technician_id']) ? (int)$data['technician_id'] : null;
                $salesRepId = isset($data['sales_rep_id']) ? (int)$data['sales_rep_id'] : null;
                $customerType = Request::sanitize($data['customer_type'] ?? 'walking');
                $bookingId = isset($data['booking_id']) ? (int)$data['booking_id'] : null;
                
                // Invoice and discount fields
                $discountAmount = isset($data['discount_amount']) ? (float)$data['discount_amount'] : 0.00;
                $discountType = Request::sanitize($data['discount_type'] ?? 'percentage');
                $discountValue = isset($data['discount_value']) ? (float)$data['discount_value'] : 0.00;
                $vatRate = isset($data['vat_rate']) ? (float)$data['vat_rate'] : 10.00;
                $vatAmount = isset($data['vat_amount']) ? (float)$data['vat_amount'] : 0.00;
                $subtotal = isset($data['subtotal']) ? (float)$data['subtotal'] : $totalAmount;

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
                        current_km, next_service_km, next_service_date, total_amount, payment_method, 
                        payment_status, service_status, notes, service_detail, technician_id, 
                        sales_rep_id, customer_type, booking_id, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $stmt->execute([
                    $invoiceNumber, $customerId, $vehicleId, $serviceTypeId, $serviceDate,
                    $currentKm, $nextServiceKm, $nextServiceDate, $totalAmount, $paymentMethod,
                    $paymentStatus, $serviceStatus, $notes, $serviceDetail, $technicianId,
                    $salesRepId, $customerType, $bookingId
                ]);

                $serviceId = $db->lastInsertId();

                // Get the created service with complete information
                $stmt = $db->prepare("
                    SELECT s.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
                           v.plate_number as vehicle_plate, v.year as vehicle_year, v.vin_number as vehicle_vin_number,
                           vm.name as vehicle_model_name, vm.category as vehicle_model_category,
                           st.service_type_name, st.category as service_category,
                           tech.name as technician_name, sales.name as sales_rep_name
                    FROM services s
                    LEFT JOIN customers c ON s.customer_id = c.id
                    LEFT JOIN vehicles v ON s.vehicle_id = v.id
                    LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                    LEFT JOIN service_types st ON s.service_type_id = st.id
                    LEFT JOIN staff tech ON s.technician_id = tech.id
                    LEFT JOIN staff sales ON s.sales_rep_id = sales.id
                    WHERE s.id = ?
                ");
                $stmt->execute([$serviceId]);
                $service = $stmt->fetch(PDO::FETCH_ASSOC);

                Response::created($service, 'Service created successfully');
            }
        }

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Services API error: " . $e->getMessage());
    Response::error('Failed to process services request', 500);
}
?>