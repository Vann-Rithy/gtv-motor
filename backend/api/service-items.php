<?php
/**
 * Service Items API
 * GTV Motor PHP Backend - Service Items Management
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
        // Get service items for a specific service
        $serviceId = Request::query('service_id');
        
        if (!$serviceId) {
            Response::error('Service ID is required', 400);
        }

        $stmt = $db->prepare("
            SELECT 
                si.*,
                s.invoice_number,
                s.service_date
            FROM service_items si
            LEFT JOIN services s ON si.service_id = s.id
            WHERE si.service_id = ?
            ORDER BY si.id
        ");
        $stmt->execute([$serviceId]);
        $serviceItems = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success($serviceItems, 'Service items retrieved successfully');

    } elseif ($method === 'POST') {
        // Create service items (bulk insert)
        $data = Request::body();
        
        if (!is_array($data) || empty($data)) {
            Response::error('Service items data is required', 400);
        }

        $createdItems = [];
        $db->beginTransaction();

        try {
            foreach ($data as $item) {
                // Validate required fields
                if (!isset($item['service_id']) || !isset($item['description']) || 
                    !isset($item['quantity']) || !isset($item['unit_price']) || 
                    !isset($item['total_price']) || !isset($item['item_type'])) {
                    throw new Exception('Missing required fields for service item');
                }

                $serviceId = (int)$item['service_id'];
                $description = Request::sanitize($item['description']);
                
                // Clean description if it has timestamp suffix (format: description_timestamp_index)
                if (preg_match('/^(.+)_\d+_\d+$/', $description, $matches)) {
                    $description = $matches[1];
                }
                
                $quantity = (int)$item['quantity'];
                $unitPrice = (float)$item['unit_price'];
                $totalPrice = (float)$item['total_price'];
                $itemType = Request::sanitize($item['item_type']);

                // Validate service exists
                $stmt = $db->prepare("SELECT id FROM services WHERE id = ?");
                $stmt->execute([$serviceId]);
                if (!$stmt->fetch()) {
                    throw new Exception("Service with ID {$serviceId} not found");
                }

                // Insert service item
                $stmt = $db->prepare("
                    INSERT INTO service_items (
                        service_id, description, quantity, unit_price, total_price, item_type, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $serviceId, $description, $quantity, $unitPrice, $totalPrice, $itemType
                ]);

                $itemId = $db->lastInsertId();
                $createdItems[] = [
                    'id' => $itemId,
                    'service_id' => $serviceId,
                    'description' => $description,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'total_price' => $totalPrice,
                    'item_type' => $itemType
                ];
            }

            $db->commit();
            Response::created($createdItems, 'Service items created successfully');

        } catch (Exception $e) {
            $db->rollback();
            throw $e;
        }

    } elseif ($method === 'PUT') {
        // Update service item
        $data = Request::body();
        Request::validateRequired($data, ['id']);

        $itemId = (int)$data['id'];
        $description = Request::sanitize($data['description'] ?? '');
        $quantity = isset($data['quantity']) ? (int)$data['quantity'] : null;
        $unitPrice = isset($data['unit_price']) ? (float)$data['unit_price'] : null;
        $totalPrice = isset($data['total_price']) ? (float)$data['total_price'] : null;
        $itemType = Request::sanitize($data['item_type'] ?? '');

        // Build update query dynamically
        $updateFields = [];
        $params = [];

        if (!empty($description)) {
            $updateFields[] = "description = ?";
            $params[] = $description;
        }
        if ($quantity !== null) {
            $updateFields[] = "quantity = ?";
            $params[] = $quantity;
        }
        if ($unitPrice !== null) {
            $updateFields[] = "unit_price = ?";
            $params[] = $unitPrice;
        }
        if ($totalPrice !== null) {
            $updateFields[] = "total_price = ?";
            $params[] = $totalPrice;
        }
        if (!empty($itemType)) {
            $updateFields[] = "item_type = ?";
            $params[] = $itemType;
        }

        if (empty($updateFields)) {
            Response::error('No fields to update', 400);
        }

        $params[] = $itemId;
        $query = "UPDATE service_items SET " . implode(', ', $updateFields) . " WHERE id = ?";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            Response::error('Service item not found', 404);
        }

        // Get updated item
        $stmt = $db->prepare("SELECT * FROM service_items WHERE id = ?");
        $stmt->execute([$itemId]);
        $updatedItem = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::success($updatedItem, 'Service item updated successfully');

    } elseif ($method === 'DELETE') {
        // Delete service item
        $itemId = Request::query('id');
        
        if (!$itemId) {
            Response::error('Item ID is required', 400);
        }

        $stmt = $db->prepare("DELETE FROM service_items WHERE id = ?");
        $stmt->execute([$itemId]);

        if ($stmt->rowCount() === 0) {
            Response::error('Service item not found', 404);
        }

        Response::success(null, 'Service item deleted successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Service Items API error: " . $e->getMessage());
    Response::error('Failed to process service items request', 500);
}
?>
