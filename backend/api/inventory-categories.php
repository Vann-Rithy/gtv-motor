<?php
/**
 * Inventory Categories API
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
        // Get inventory categories
        $query = "SELECT * FROM inventory_categories ORDER BY name ASC";
        $categories = $db->prepare($query);
        $categories->execute();
        $categories = $categories->fetchAll(PDO::FETCH_ASSOC);

        Response::success($categories, 'Inventory categories retrieved successfully');

    } elseif ($method === 'POST') {
        // Create new inventory category
        $data = Request::body();
        Request::validateRequired($data, ['name']);

        $name = Request::sanitize($data['name']);
        $description = Request::sanitize($data['description'] ?? '');

        // Check if category already exists
        $stmt = $db->prepare("SELECT id FROM inventory_categories WHERE name = ?");
        $stmt->execute([$name]);
        if ($stmt->fetch()) {
            Response::error('Category already exists', 409);
        }

        $stmt = $db->prepare("
            INSERT INTO inventory_categories (name, description, created_at)
            VALUES (?, ?, NOW())
        ");

        $stmt->execute([$name, $description]);
        $categoryId = $db->lastInsertId();

        // Get created category
        $stmt = $db->prepare("SELECT * FROM inventory_categories WHERE id = ?");
        $stmt->execute([$categoryId]);
        $category = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::created($category, 'Inventory category created successfully');

    } elseif ($method === 'PUT') {
        // Update inventory category
        $data = Request::body();
        Request::validateRequired($data, ['id', 'name']);

        $id = (int)$data['id'];
        $name = Request::sanitize($data['name']);
        $description = Request::sanitize($data['description'] ?? '');

        // Check if category exists
        $stmt = $db->prepare("SELECT id FROM inventory_categories WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            Response::error('Category not found', 404);
        }

        // Check if name already exists (excluding current category)
        $stmt = $db->prepare("SELECT id FROM inventory_categories WHERE name = ? AND id != ?");
        $stmt->execute([$name, $id]);
        if ($stmt->fetch()) {
            Response::error('Category name already exists', 409);
        }

        $stmt = $db->prepare("
            UPDATE inventory_categories
            SET name = ?, description = ?, updated_at = NOW()
            WHERE id = ?
        ");

        $stmt->execute([$name, $description, $id]);

        // Get updated category
        $stmt = $db->prepare("SELECT * FROM inventory_categories WHERE id = ?");
        $stmt->execute([$id]);
        $category = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::success($category, 'Inventory category updated successfully');

    } elseif ($method === 'DELETE') {
        // Delete inventory category
        $id = Request::query('id');
        if (!$id) {
            Response::error('Category ID is required', 400);
        }

        $id = (int)$id;

        // Check if category exists
        $stmt = $db->prepare("SELECT id FROM inventory_categories WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            Response::error('Category not found', 404);
        }

        // Check if category is being used by any inventory items
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM inventory_items WHERE category_id = ?");
        $stmt->execute([$id]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        if ($count > 0) {
            Response::error('Cannot delete category that is being used by inventory items', 409);
        }

        $stmt = $db->prepare("DELETE FROM inventory_categories WHERE id = ?");
        $stmt->execute([$id]);

        Response::success(null, 'Inventory category deleted successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Inventory categories API error: " . $e->getMessage());
    Response::error('Failed to process inventory categories request', 500);
}
?>
