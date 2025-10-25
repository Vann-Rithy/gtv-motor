<?php
/**
 * Stock Movements API
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
        // Get stock movements with pagination
        $pagination = Request::getPagination();
        $itemId = Request::query('item_id');
        
        $where = [];
        $params = [];
        
        if ($itemId) {
            $where[] = "sm.item_id = ?";
            $params[] = $itemId;
        }
        
        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        $query = "
            SELECT 
                sm.*,
                i.name as item_name,
                i.sku as item_sku,
                ic.name as category_name
            FROM stock_movements sm
            LEFT JOIN inventory_items i ON sm.item_id = i.id
            LEFT JOIN inventory_categories ic ON i.category_id = ic.id
            {$whereClause}
            ORDER BY sm.created_at DESC
            LIMIT {$pagination['limit']} OFFSET {$pagination['offset']}
        ";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $movements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get total count
        $countQuery = "
            SELECT COUNT(*) as total
            FROM stock_movements sm
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
        
        Response::paginated($movements, $paginationData, 'Stock movements retrieved successfully');
        
    } elseif ($method === 'POST') {
        // Create new stock movement
        $data = Request::body();
        
        // Debug logging
        error_log("Stock movement creation data: " . json_encode($data));
        
        // Validate required fields
        Request::validateRequired($data, ['item_id', 'movement_type', 'quantity']);
        
        $itemId = (int)$data['item_id'];
        $movementType = Request::sanitize($data['movement_type']);
        $quantity = (int)$data['quantity'];
        $referenceType = Request::sanitize($data['reference_type'] ?? 'adjustment');
        $referenceId = isset($data['reference_id']) ? (int)$data['reference_id'] : null;
        $notes = Request::sanitize($data['notes'] ?? '');
        $movementDate = $data['movement_date'] ?? date('Y-m-d');
        
        // Validate movement type
        if (!in_array($movementType, ['in', 'out'])) {
            Response::error('Invalid movement type. Must be "in" or "out"', 400);
        }
        
        // Validate item exists
        $stmt = $db->prepare("SELECT id, current_stock FROM inventory_items WHERE id = ?");
        $stmt->execute([$itemId]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$item) {
            Response::error('Inventory item not found', 404);
        }
        
        // Calculate new stock level
        $currentStock = (int)$item['current_stock'];
        $newStock = $movementType === 'in' 
            ? $currentStock + $quantity 
            : $currentStock - $quantity;
        
        // Prevent negative stock for 'out' movements
        if ($newStock < 0) {
            Response::error('Insufficient stock. Current stock: ' . $currentStock . ', Requested: ' . $quantity, 400);
        }
        
        // Start transaction
        $db->beginTransaction();
        
        try {
            // Insert stock movement record
            $stmt = $db->prepare("
                INSERT INTO stock_movements (
                    item_id, movement_type, quantity, reference_type, reference_id, 
                    notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $itemId, $movementType, $quantity, $referenceType, $referenceId,
                $notes
            ]);
            
            $movementId = $db->lastInsertId();
            
            // Update inventory stock level
            $stmt = $db->prepare("UPDATE inventory_items SET current_stock = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$newStock, $itemId]);
            
            // Commit transaction
            $db->commit();
            
            // Get the created movement with item details
            $stmt = $db->prepare("
                SELECT 
                    sm.*,
                    i.name as item_name,
                    i.sku as item_sku,
                    i.current_stock as new_stock_level
                FROM stock_movements sm
                LEFT JOIN inventory_items i ON sm.item_id = i.id
                WHERE sm.id = ?
            ");
            $stmt->execute([$movementId]);
            $movement = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::created($movement, 'Stock movement recorded successfully');
            
        } catch (Exception $e) {
            // Rollback transaction on error
            $db->rollBack();
            throw $e;
        }
        
    } else {
        Response::error('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log("Stock movements API error: " . $e->getMessage());
    Response::error('Failed to process stock movements request', 500);
}
?>
