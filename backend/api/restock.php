<?php
/**
 * Restock API
 * GTV Motor PHP Backend - Bulk Inventory Restocking
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
        // Get restock suggestions (low stock and out of stock items)
        $pagination = Request::getPagination();
        $lowStock = Request::query('low_stock') === 'true';
        $outOfStock = Request::query('out_of_stock') === 'true';

        $where = [];
        $params = [];

        if ($lowStock && !$outOfStock) {
            $where[] = "i.current_stock <= i.min_stock AND i.current_stock > 0";
        } elseif ($outOfStock && !$lowStock) {
            $where[] = "i.current_stock = 0";
        } elseif ($lowStock && $outOfStock) {
            $where[] = "(i.current_stock <= i.min_stock OR i.current_stock = 0)";
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
            ORDER BY i.current_stock ASC, i.name ASC
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

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

        Response::paginated($items, $paginationData, 'Restock suggestions retrieved successfully');

    } elseif ($method === 'POST') {
        // Process bulk restock
        $data = Request::body();
        Request::validateRequired($data, ['items']);

        if (!is_array($data['items']) || empty($data['items'])) {
            Response::error('Items array is required and cannot be empty', 400);
        }

        $supplier = Request::sanitize($data['supplier'] ?? '');
        $notes = Request::sanitize($data['notes'] ?? '');

        // Start transaction
        $db->beginTransaction();

        try {
            $restockedItems = [];
            $itemsRestocked = 0;
            $totalValue = 0;

            foreach ($data['items'] as $itemData) {
                if (!isset($itemData['item_id']) || !isset($itemData['quantity'])) {
                    throw new Exception('Each item must have item_id and quantity');
                }

                $itemId = (int)$itemData['item_id'];
                $quantity = (int)$itemData['quantity'];

                if ($quantity <= 0) {
                    continue; // Skip invalid quantities
                }

                // Validate item exists and get current stock
                $stmt = $db->prepare("SELECT id, current_stock, unit_price, name FROM inventory_items WHERE id = ?");
                $stmt->execute([$itemId]);
                $item = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$item) {
                    throw new Exception("Inventory item with ID {$itemId} not found");
                }

                $currentStock = (int)$item['current_stock'];
                $newStock = $currentStock + $quantity;
                $unitPrice = (float)$item['unit_price'];

                // Record stock movement
                $stmt = $db->prepare("
                    INSERT INTO stock_movements (
                        item_id, movement_type, quantity, reference_type, reference_id, 
                        notes, created_at
                    ) VALUES (?, 'in', ?, 'purchase', NULL, ?, NOW())
                ");
                
                $movementNotes = $supplier ? "Restock from {$supplier}" : 'Restock';
                if ($notes) {
                    $movementNotes .= " - {$notes}";
                }
                
                $stmt->execute([$itemId, $quantity, $movementNotes]);
                $movementId = $db->lastInsertId();

                // Update inventory stock level
                $stmt = $db->prepare("
                    UPDATE inventory_items 
                    SET current_stock = ?, last_restocked = CURDATE(), updated_at = NOW() 
                    WHERE id = ?
                ");
                $stmt->execute([$newStock, $itemId]);

                // Update supplier if provided
                if ($supplier) {
                    $stmt = $db->prepare("UPDATE inventory_items SET supplier = ? WHERE id = ?");
                    $stmt->execute([$supplier, $itemId]);
                }

                $restockedItems[] = [
                    'item_id' => $itemId,
                    'item_name' => $item['name'],
                    'quantity' => $quantity,
                    'previous_stock' => $currentStock,
                    'new_stock' => $newStock,
                    'unit_price' => $unitPrice,
                    'total_value' => $quantity * $unitPrice
                ];

                $itemsRestocked++;
                $totalValue += $quantity * $unitPrice;
            }

            // Commit transaction
            $db->commit();

            Response::success([
                'items_restocked' => $itemsRestocked,
                'total_value' => $totalValue,
                'items' => $restockedItems
            ], 'Items restocked successfully');

        } catch (Exception $e) {
            // Rollback transaction on error
            $db->rollBack();
            error_log("Restock API error: " . $e->getMessage());
            Response::error('Failed to process restock: ' . $e->getMessage(), 500);
        }

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Restock API error: " . $e->getMessage());
    Response::error('Failed to process restock request', 500);
}
?>

