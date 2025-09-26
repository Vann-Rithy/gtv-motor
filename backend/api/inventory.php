<?php
/**
 * Inventory API
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
        // Get inventory items with pagination and search
        $pagination = Request::getPagination();
        $search = Request::getSearch();
        $lowStock = Request::query('low_stock') === 'true';
        $outOfStock = Request::query('out_of_stock') === 'true';
        $categoryId = Request::query('category_id');

        $where = [];
        $params = [];

        if (!empty($search['search'])) {
            $where[] = "(i.name LIKE ? OR i.sku LIKE ? OR ic.name LIKE ?)";
            $searchTerm = '%' . $search['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        if ($lowStock && !$outOfStock) {
            $where[] = "i.current_stock <= i.min_stock AND i.current_stock > 0";
        } elseif ($outOfStock && !$lowStock) {
            $where[] = "i.current_stock = 0";
        } elseif ($lowStock && $outOfStock) {
            $where[] = "(i.current_stock <= i.min_stock OR i.current_stock = 0)";
        }

        if ($categoryId) {
            $where[] = "i.category_id = ?";
            $params[] = $categoryId;
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $query = "
            SELECT
                i.*,
                ic.name as category_name,
                CASE
                    WHEN i.current_stock = 0 THEN 'out_of_stock'
                    WHEN i.current_stock <= i.min_stock THEN 'low'
                    WHEN i.current_stock >= i.max_stock THEN 'high'
                    ELSE 'normal'
                END as stock_status
            FROM inventory_items i
            LEFT JOIN inventory_categories ic ON i.category_id = ic.id
            {$whereClause}
            ORDER BY i.{$search['sortBy']} {$search['sortOrder']}
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";

        $inventory = $db->prepare($query);
        $inventory->execute($params);
        $inventory = $inventory->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $countQuery = "
            SELECT COUNT(i.id) as total
            FROM inventory_items i
            LEFT JOIN inventory_categories ic ON i.category_id = ic.id
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

        Response::paginated($inventory, $paginationData, 'Inventory items retrieved successfully');

    } elseif ($method === 'POST') {
        // Create new inventory item
        $data = Request::body();
        Request::validateRequired($data, ['name', 'category_id', 'current_stock', 'min_stock', 'max_stock', 'unit_price']);

        $categoryId = (int)$data['category_id'];
        $name = Request::sanitize($data['name']);
        $sku = Request::sanitize($data['sku'] ?? '');
        $currentStock = (int)$data['current_stock'];
        $minStock = (int)$data['min_stock'];
        $maxStock = (int)$data['max_stock'];
        $unitPrice = (float)$data['unit_price'];
        $supplier = Request::sanitize($data['supplier'] ?? '');
        $lastRestocked = $data['last_restocked'] ?? null;

        // Validate category exists
        $stmt = $db->prepare("SELECT id FROM inventory_categories WHERE id = ?");
        $stmt->execute([$categoryId]);
        if (!$stmt->fetch()) {
            Response::error('Category not found', 404);
        }

        // Check if SKU already exists (if provided)
        if (!empty($sku)) {
            $stmt = $db->prepare("SELECT id FROM inventory_items WHERE sku = ?");
            $stmt->execute([$sku]);
            if ($stmt->fetch()) {
                Response::error('SKU already exists', 409);
            }
        }

        $stmt = $db->prepare("
            INSERT INTO inventory_items (
                category_id, name, sku, current_stock, min_stock, max_stock,
                unit_price, supplier, last_restocked, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");

        $stmt->execute([
            $categoryId, $name, $sku ?: null, $currentStock, $minStock, $maxStock,
            $unitPrice, $supplier ?: null, $lastRestocked
        ]);

        $itemId = $db->lastInsertId();

        // Get created item with category info
        $stmt = $db->prepare("
            SELECT
                i.*,
                ic.name as category_name
            FROM inventory_items i
            LEFT JOIN inventory_categories ic ON i.category_id = ic.id
            WHERE i.id = ?
        ");
        $stmt->execute([$itemId]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::created($item, 'Inventory item created successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Inventory API error: " . $e->getMessage());
    Response::error('Failed to process inventory request', 500);
}
?>
