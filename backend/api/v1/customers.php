<?php
/**
 * Customers API v1
 * GTV Motor PHP Backend - Complete Customer Information
 * Endpoint: api.gtvmotor.dev/v1/customers
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/Request.php';
require_once __DIR__ . '/../../includes/Response.php';
require_once __DIR__ . '/middleware/ApiAuth.php';
require_once __DIR__ . '/middleware/ApiAnalytics.php';

try {
    // Validate API Key (starts analytics tracking)
    $keyConfig = ApiAuth::validateApiKey();
    $apiKey = ApiAuth::getApiKey();

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
        // The router in index.php strips /api/v1, so when we get here, path is like: /customers/1 or customers/1
        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);

        // Remove base path if present
        if (strpos($path, '/api/v1/') === 0) {
            $path = substr($path, 8); // Remove '/api/v1/'
        } elseif (strpos($path, '/api/v1') === 0) {
            $path = substr($path, 7); // Remove '/api/v1'
        } elseif (strpos($path, '/v1/') === 0) {
            $path = substr($path, 4); // Remove '/v1/'
        } elseif (strpos($path, '/v1') === 0) {
            $path = substr($path, 3); // Remove '/v1'
        }

        $segments = explode('/', trim($path, '/'));
        $segments = array_filter($segments);
        $segments = array_values($segments);

        $customerId = null;
        // After processing, segments should be: [0] => 'customers', [1] => '1' (if ID provided)
        // Check if we have a numeric ID in the segments
        foreach ($segments as $segment) {
            if (is_numeric($segment) && $segment > 0) {
                $customerId = $segment;
                break;
            }
        }

        if ($customerId && is_numeric($customerId) && $customerId > 0) {
            // Ensure customerId is an integer for database queries
            $customerId = (int)$customerId;

            // Get individual customer with complete information
            $stmt = $db->prepare("
                SELECT
                    c.id,
                    c.name,
                    c.phone,
                    c.email,
                    c.address,
                    c.created_at,
                    c.updated_at,
                    COUNT(DISTINCT v.id) as vehicle_count,
                    COUNT(DISTINCT s.id) as service_count,
                    COALESCE(SUM(s.total_amount), 0) as total_spent,
                    MAX(s.service_date) as last_service_date,
                    MIN(s.service_date) as first_service_date,
                    SUM(CASE WHEN s.service_status = 'completed' THEN 1 ELSE 0 END) as completed_services,
                    SUM(CASE WHEN s.service_status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_services,
                    SUM(CASE WHEN s.service_status = 'pending' THEN 1 ELSE 0 END) as pending_services
                FROM customers c
                LEFT JOIN vehicles v ON c.id = v.customer_id
                LEFT JOIN services s ON c.id = s.customer_id
                WHERE c.id = ? AND c.id > 0
                GROUP BY c.id
            ");
            $stmt->execute([$customerId]);
            $customer = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$customer) {
                Response::notFound('Customer not found');
            }

            // Get all vehicles for this customer
            $stmt = $db->prepare("
                SELECT
                    v.id,
                    v.plate_number,
                    v.vin_number,
                    v.year,
                    v.current_km,
                    v.purchase_date,
                    v.warranty_start_date,
                    v.warranty_end_date,
                    v.warranty_km_limit,
                    v.warranty_service_count,
                    v.warranty_max_services,
                    vm.name as vehicle_model_name,
                    vm.category as vehicle_model_category,
                    vm.base_price as vehicle_model_base_price,
                    vm.cc_displacement,
                    vm.engine_type,
                    vm.fuel_type,
                    vm.transmission,
                    COUNT(DISTINCT s.id) as service_count,
                    MAX(s.service_date) as last_service_date,
                    SUM(s.total_amount) as total_service_amount
                FROM vehicles v
                LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                LEFT JOIN services s ON v.id = s.vehicle_id
                WHERE v.customer_id = ?
                GROUP BY v.id
                ORDER BY v.created_at DESC
            ");
            $stmt->execute([$customerId]);
            $vehicles = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all services for this customer with complete details
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
                LEFT JOIN vehicles v ON s.vehicle_id = v.id
                LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
                LEFT JOIN service_types st ON s.service_type_id = st.id
                LEFT JOIN staff tech ON s.technician_id = tech.id
                LEFT JOIN staff sales ON s.sales_rep_id = sales.id
                WHERE s.customer_id = ?
                ORDER BY s.service_date DESC, s.id DESC
            ");
            $stmt->execute([$customerId]);
            $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Debug: Log if services are found
            error_log("Customer ID {$customerId}: Found " . count($services) . " services");
            if (count($services) > 0) {
                error_log("First service sample: " . json_encode($services[0]));
            }

            // Format services with complete information structure
            $formattedServices = [];
            $serviceErrors = [];
            foreach ($services as $index => $service) {
                try {
                    // Ensure service ID exists
                    if (!isset($service['id']) || empty($service['id'])) {
                        error_log("Skipping service with missing ID: " . json_encode($service));
                        continue;
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
                            si.created_at
                        FROM service_items si
                        WHERE si.service_id = ?
                        ORDER BY si.id
                    ");
                    $itemsStmt->execute([(int)$service['id']]);
                    $serviceItems = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

                    // If no service items found, return empty array (not null)
                    if (!$serviceItems) {
                        $serviceItems = [];
                    }

                    // Helper function to safely format numbers
                    $formatNumber = function($value) {
                        if ($value === null || $value === '' || $value === false) return null;
                        $floatVal = (float)$value;
                        // Format even if 0, but return null for truly empty values
                        return number_format($floatVal, 2, '.', '');
                    };

                    // Format service - remove duplicates, keep only essential info
                    $formattedService = [
                        'id' => (int)$service['id'],
                        'invoice_number' => $service['invoice_number'] ?? null,
                        'service_date' => $service['service_date'] ?? null,
                        'service_status' => $service['service_status'] ?? 'pending',
                        'payment_status' => $service['payment_status'] ?? 'pending',
                        'payment_method' => $service['payment_method'] ?? null,
                        'total_amount' => $service['total_amount'] !== null && $service['total_amount'] !== ''
                            ? number_format((float)$service['total_amount'], 2, '.', '')
                            : '0.00',
                        'current_km' => $service['current_km'] ?? null,
                        'next_service_km' => $service['next_service_km'] ?? null,
                        'next_service_date' => $service['next_service_date'] ?? null,
                        'volume_l' => $formatNumber($service['volume_l']),
                        // Only include exchange rate and KHR if they have meaningful values
                        'exchange_rate' => ($service['exchange_rate'] && (float)$service['exchange_rate'] > 0)
                            ? number_format((float)$service['exchange_rate'], 2, '.', '')
                            : null,
                        'total_khr' => ($service['total_khr'] && (float)$service['total_khr'] > 0)
                            ? number_format((float)$service['total_khr'], 2, '.', '')
                            : null,
                        // Vehicle reference only (full vehicle info is in vehicles array)
                        'vehicle_id' => $service['vehicle_id'] ? (int)$service['vehicle_id'] : null,
                        'vehicle_plate' => $service['vehicle_plate'] ?? null,
                        // Service type info
                        'service_type' => $service['service_type_name'] ?? null,
                        'service_type_id' => $service['service_type_id'] ? (int)$service['service_type_id'] : null,
                        'service_cost' => $formatNumber($service['service_cost']),
                        // Staff references
                        'technician_id' => $service['technician_id'] ? (int)$service['technician_id'] : null,
                        'technician_name' => $service['technician_name'] ?? null,
                        'sales_rep_id' => $service['sales_rep_id'] ? (int)$service['sales_rep_id'] : null,
                        'sales_rep_name' => $service['sales_rep_name'] ?? null,
                        // Notes (combine service_detail and notes if both exist)
                        'notes' => trim(($service['service_detail'] ?? '') . ' ' . ($service['notes'] ?? '')) ?: null,
                        // Service items
                        'items' => $serviceItems,
                        // Timestamps
                        'created_at' => $service['created_at'] ?? null,
                        'updated_at' => $service['updated_at'] ?? null
                    ];

                    // Remove null/empty string values for cleaner response (but keep empty arrays)
                    $formattedService = array_filter($formattedService, function($value) {
                        if (is_array($value)) {
                            return true; // Keep arrays even if empty
                        }
                        return $value !== null && $value !== '';
                    }, ARRAY_FILTER_USE_BOTH);
                    $formattedServices[] = $formattedService;
                } catch (Exception $e) {
                    $serviceId = $service['id'] ?? 'unknown';
                    $errorMsg = "Error formatting service ID {$serviceId} at index {$index}: " . $e->getMessage();
                    error_log($errorMsg);
                    error_log("Service data: " . json_encode($service));
                    error_log("Stack trace: " . $e->getTraceAsString());
                    $serviceErrors[] = $errorMsg;
                    // Continue with other services even if one fails
                    continue;
                }
            }

            // Log summary
            if (count($services) > 0 && count($formattedServices) === 0) {
                error_log("WARNING: All " . count($services) . " services failed to format. Errors: " . implode("; ", $serviceErrors));
            }

            $services = $formattedServices;

            // Format customer basic info with complete structure
            $customerData = [
                'id' => $customer['id'],
                'name' => $customer['name'],
                'phone' => $customer['phone'],
                'email' => $customer['email'] ?? null,
                'address' => $customer['address'] ?? null,
                'created_at' => $customer['created_at'],
                'updated_at' => $customer['updated_at'],
                'statistics' => [
                    'vehicle_count' => (int)$customer['vehicle_count'],
                    'service_count' => (int)$customer['service_count'],
                    'total_spent' => number_format((float)$customer['total_spent'], 2, '.', ''),
                    'last_service_date' => $customer['last_service_date'],
                    'first_service_date' => $customer['first_service_date'],
                    'completed_services' => (int)$customer['completed_services'],
                    'in_progress_services' => (int)$customer['in_progress_services'],
                    'pending_services' => (int)$customer['pending_services']
                ],
                'vehicles' => $vehicles,
                'services' => $services
            ];

            Response::success($customerData, 'Customer information retrieved successfully');
            return;
        }

        // Get customers list with pagination
        $pagination = Request::getPagination();
        $search = Request::getSearch();

        $where = ["c.id IS NOT NULL AND c.id > 0"];
        $params = [];

        if (!empty($search['search'])) {
            $where[] = "(c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)";
            $searchTerm = '%' . $search['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);

        $query = "
            SELECT
                c.id,
                c.name,
                c.phone,
                c.email,
                c.address,
                c.created_at,
                c.updated_at,
                COUNT(DISTINCT v.id) as vehicle_count,
                COUNT(DISTINCT s.id) as service_count,
                COALESCE(SUM(s.total_amount), 0) as total_spent,
                MAX(s.service_date) as last_service_date
            FROM customers c
            LEFT JOIN vehicles v ON c.id = v.customer_id
            LEFT JOIN services s ON c.id = s.customer_id
            {$whereClause}
            GROUP BY c.id
            ORDER BY c.{$search['sortBy']} {$search['sortOrder']}
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $countQuery = "
            SELECT COUNT(*) as total
            FROM customers c
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

        // Log analytics
        $responseData = json_encode($customers);
        ApiAnalytics::logRequest($apiKey, $keyConfig, 200, strlen($responseData));

        Response::paginated($customers, $paginationData, 'Customers retrieved successfully');

    } elseif ($method === 'POST') {
        // Create new customer
        // Check write permission
        if (!ApiAuth::hasPermission($keyConfig, 'write')) {
            Response::forbidden('API key does not have write permission.');
        }

        $data = Request::body();

        // Validate required fields
        Request::validateRequired($data, ['name', 'phone']);

        // Sanitize and clean data
        $name = Request::sanitize($data['name']);
        $phone = Request::sanitize($data['phone']);
        $email = !empty($data['email']) ? Request::sanitize($data['email']) : null;
        $address = !empty($data['address']) ? Request::sanitize($data['address']) : null;

        // Remove timestamp suffix if present (from frontend)
        if (preg_match('/^(.+)_\d+$/', $name, $matches)) {
            $name = $matches[1];
        }
        if (preg_match('/^(.+)_\d+$/', $phone, $matches)) {
            $phone = $matches[1];
        }

        // Insert customer
        $stmt = $db->prepare("
            INSERT INTO customers (name, phone, email, address, created_at, updated_at)
            VALUES (?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([$name, $phone, $email, $address]);

        $customerId = $db->lastInsertId();

        // Get created customer
        $stmt = $db->prepare("
            SELECT id, name, phone, email, address, created_at, updated_at
            FROM customers
            WHERE id = ?
        ");
        $stmt->execute([$customerId]);
        $customer = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::created($customer, 'Customer created successfully');

    } elseif ($method === 'PUT' || $method === 'PATCH') {
        // Update customer
        // Check write permission
        if (!ApiAuth::hasPermission($keyConfig, 'write')) {
            Response::forbidden('API key does not have write permission.');
        }

        // Get customer ID from URL
        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        $segments = array_filter($segments);
        $segments = array_values($segments);

        $customerId = null;
        if (isset($segments[2]) && is_numeric($segments[2])) {
            $customerId = $segments[2];
        }

        if (!$customerId) {
            Response::error('Customer ID is required', 400);
        }

        // Check if customer exists
        $stmt = $db->prepare("SELECT id FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        if (!$stmt->fetch()) {
            Response::notFound('Customer not found');
        }

        $data = Request::body();

        // Build dynamic UPDATE query
        $updateFields = [];
        $updateValues = [];

        if (isset($data['name'])) {
            $updateFields[] = "name = ?";
            $name = Request::sanitize($data['name']);
            // Remove timestamp suffix if present
            if (preg_match('/^(.+)_\d+$/', $name, $matches)) {
                $name = $matches[1];
            }
            $updateValues[] = $name;
        }

        if (isset($data['phone'])) {
            $updateFields[] = "phone = ?";
            $phone = Request::sanitize($data['phone']);
            if (preg_match('/^(.+)_\d+$/', $phone, $matches)) {
                $phone = $matches[1];
            }
            $updateValues[] = $phone;
        }

        if (isset($data['email'])) {
            $updateFields[] = "email = ?";
            $updateValues[] = !empty($data['email']) ? Request::sanitize($data['email']) : null;
        }

        if (isset($data['address'])) {
            $updateFields[] = "address = ?";
            $updateValues[] = !empty($data['address']) ? Request::sanitize($data['address']) : null;
        }

        if (empty($updateFields)) {
            Response::error('No fields to update', 400);
        }

        $updateFields[] = "updated_at = NOW()";
        $updateValues[] = $customerId;

        $updateQuery = "UPDATE customers SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $db->prepare($updateQuery);
        $stmt->execute($updateValues);

        // Get updated customer
        $stmt = $db->prepare("
            SELECT id, name, phone, email, address, created_at, updated_at
            FROM customers
            WHERE id = ?
        ");
        $stmt->execute([$customerId]);
        $customer = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::success($customer, 'Customer updated successfully');

    } elseif ($method === 'DELETE') {
        // Delete customer
        // Check write permission
        if (!ApiAuth::hasPermission($keyConfig, 'write')) {
            Response::forbidden('API key does not have write permission.');
        }

        // Get customer ID from URL
        $uri = $_SERVER['REQUEST_URI'];
        $path = parse_url($uri, PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        $segments = array_filter($segments);
        $segments = array_values($segments);

        $customerId = null;
        if (isset($segments[2]) && is_numeric($segments[2])) {
            $customerId = $segments[2];
        }

        if (!$customerId) {
            Response::error('Customer ID is required', 400);
        }

        // Check if customer exists
        $stmt = $db->prepare("SELECT id FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        if (!$stmt->fetch()) {
            Response::notFound('Customer not found');
        }

        // Check if customer has vehicles or services (optional - you can decide to allow deletion or not)
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM vehicles WHERE customer_id = ?");
        $stmt->execute([$customerId]);
        $vehicleCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        $stmt = $db->prepare("SELECT COUNT(*) as count FROM services WHERE customer_id = ?");
        $stmt->execute([$customerId]);
        $serviceCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        if ($vehicleCount > 0 || $serviceCount > 0) {
            Response::error('Cannot delete customer with associated vehicles or services', 409);
        }

        // Delete customer
        $stmt = $db->prepare("DELETE FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);

        Response::noContent('Customer deleted successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("API v1 Customers error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    Response::error('Failed to process request: ' . $e->getMessage(), 500);
}
?>

