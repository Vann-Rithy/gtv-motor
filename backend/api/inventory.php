<?php
/**
 * Inventory API
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
    
    // Check if there's an ID in the URL (e.g., /api/inventory/21)
    $uri = $_SERVER['REQUEST_URI'];
    $path = parse_url($uri, PHP_URL_PATH);
    
    $itemId = null;
    // Check if URL matches pattern /api/inventory/{id} or /backend/api/inventory/{id}
    if (preg_match('#(/backend)?/api/inventory/(\d+)#', $path, $matches)) {
        $itemId = (int)$matches[2];
    }

    if ($method === 'GET') {
        if ($itemId) {
            // Get single inventory item by ID
            $stmt = $db->prepare("
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
                WHERE i.id = ?
            ");
            $stmt->execute([$itemId]);
            $item = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$item) {
                Response::error('Inventory item not found', 404);
            }
            
            Response::success($item, 'Inventory item retrieved successfully');
        } else {
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
        }

    } elseif ($method === 'PUT' && $itemId) {
        // Update inventory item
        $data = Request::body();
        Request::validateRequired($data, ['name', 'unit_price']);

        // Check if item exists
        $stmt = $db->prepare("SELECT id FROM inventory_items WHERE id = ?");
        $stmt->execute([$itemId]);
        if (!$stmt->fetch()) {
            Response::error('Inventory item not found', 404);
        }

        $categoryId = isset($data['category_id']) && !empty($data['category_id']) ? (int)$data['category_id'] : null;
        $vehicleModelId = isset($data['vehicle_model_id']) && !empty($data['vehicle_model_id']) ? (int)$data['vehicle_model_id'] : null;
        $name = Request::sanitize($data['name']);
        $nameKhmer = Request::sanitize($data['name_khmer'] ?? '');
        $partPlate = Request::sanitize($data['part_plate'] ?? '');
        $sku = Request::sanitize($data['sku'] ?? '');
        $currentStock = (int)($data['current_stock'] ?? 0);
        $minStock = (int)($data['min_stock'] ?? 0);
        $maxStock = (int)($data['max_stock'] ?? 100);
        $unitPrice = (float)$data['unit_price'];
        $supplier = Request::sanitize($data['supplier'] ?? '');

        // Validate category exists (if provided)
        if ($categoryId) {
            $stmt = $db->prepare("SELECT id FROM inventory_categories WHERE id = ?");
            $stmt->execute([$categoryId]);
            if (!$stmt->fetch()) {
                Response::error('Category not found', 404);
            }
        }

        // Validate vehicle model exists (if provided)
        if ($vehicleModelId) {
            $stmt = $db->prepare("SELECT id FROM vehicle_models WHERE id = ?");
            $stmt->execute([$vehicleModelId]);
            if (!$stmt->fetch()) {
                Response::error('Vehicle model not found', 404);
            }
        }

        // Check if SKU already exists (excluding current item)
        if (!empty($sku)) {
            $stmt = $db->prepare("SELECT id FROM inventory_items WHERE sku = ? AND id != ?");
            $stmt->execute([$sku, $itemId]);
            if ($stmt->fetch()) {
                Response::error('SKU already exists', 409);
            }
        }

        // Build update query
        $updateFields = [];
        $updateValues = [];

        $updateFields[] = "name = ?";
        $updateValues[] = $name;

        if ($nameKhmer !== null && $nameKhmer !== '') {
            $updateFields[] = "name_khmer = ?";
            $updateValues[] = $nameKhmer;
        } else {
            $updateFields[] = "name_khmer = NULL";
        }

        if ($partPlate !== null && $partPlate !== '') {
            $updateFields[] = "part_plate = ?";
            $updateValues[] = $partPlate;
        } else {
            $updateFields[] = "part_plate = NULL";
        }

        if ($sku !== null && $sku !== '') {
            $updateFields[] = "sku = ?";
            $updateValues[] = $sku;
        } else {
            $updateFields[] = "sku = NULL";
        }

        $updateFields[] = "current_stock = ?";
        $updateValues[] = $currentStock;

        $updateFields[] = "min_stock = ?";
        $updateValues[] = $minStock;

        $updateFields[] = "max_stock = ?";
        $updateValues[] = $maxStock;

        $updateFields[] = "unit_price = ?";
        $updateValues[] = $unitPrice;

        if ($supplier !== null && $supplier !== '') {
            $updateFields[] = "supplier = ?";
            $updateValues[] = $supplier;
        } else {
            $updateFields[] = "supplier = NULL";
        }

        if ($categoryId) {
            $updateFields[] = "category_id = ?";
            $updateValues[] = $categoryId;
        } else {
            $updateFields[] = "category_id = NULL";
        }

        if ($vehicleModelId) {
            $updateFields[] = "vehicle_model_id = ?";
            $updateValues[] = $vehicleModelId;
        } else {
            $updateFields[] = "vehicle_model_id = NULL";
        }

        $updateFields[] = "updated_at = NOW()";

        $updateValues[] = $itemId;

        $sql = "UPDATE inventory_items SET " . implode(', ', $updateFields) . " WHERE id = ?";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($updateValues);

        // Get updated item with category info
        $stmt = $db->prepare("
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
            WHERE i.id = ?
        ");
        $stmt->execute([$itemId]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::success($item, 'Inventory item updated successfully');

    } elseif ($method === 'POST') {
        // Handle both JSON and multipart/form-data requests
        $isMultipart = false;
        $contentType = Request::headers('Content-Type') ?? '';
        
        // Debug logging
        error_log("Content-Type: " . $contentType);
        error_log("FILES array: " . print_r($_FILES, true));
        error_log("POST array: " . print_r($_POST, true));
        
        // Check if request is multipart/form-data
        if (strpos($contentType, 'multipart/form-data') !== false || !empty($_FILES)) {
            $isMultipart = true;
            $data = $_POST;
            error_log("Detected multipart/form-data request");
        } else {
            $data = Request::body();
            error_log("Using JSON request body");
        }

        // Validate required fields
        $requiredFields = ['name', 'unit_price'];
        Request::validateRequired($data, $requiredFields);

        $categoryId = isset($data['category_id']) && !empty($data['category_id']) ? (int)$data['category_id'] : null;
        $vehicleModelId = isset($data['vehicle_model_id']) && !empty($data['vehicle_model_id']) ? (int)$data['vehicle_model_id'] : null;
        $name = Request::sanitize($data['name']);
        $nameKhmer = Request::sanitize($data['name_khmer'] ?? '');
        $partPlate = Request::sanitize($data['part_plate'] ?? '');
        $sku = Request::sanitize($data['sku'] ?? '');
        $currentStock = (int)($data['current_stock'] ?? 0);
        $minStock = (int)($data['min_stock'] ?? 0);
        $maxStock = (int)($data['max_stock'] ?? 100);
        $unitPrice = (float)$data['unit_price'];
        $supplier = Request::sanitize($data['supplier'] ?? '');
        $lastRestocked = $data['last_restocked'] ?? null;

        // Validate category exists (if provided)
        if ($categoryId) {
            $stmt = $db->prepare("SELECT id FROM inventory_categories WHERE id = ?");
            $stmt->execute([$categoryId]);
            if (!$stmt->fetch()) {
                Response::error('Category not found', 404);
            }
        }

        // Validate vehicle model exists (if provided)
        if ($vehicleModelId) {
            $stmt = $db->prepare("SELECT id FROM vehicle_models WHERE id = ?");
            $stmt->execute([$vehicleModelId]);
            if (!$stmt->fetch()) {
                Response::error('Vehicle model not found', 404);
            }
        }

        // Check if SKU already exists (if provided)
        if (!empty($sku) && trim($sku) !== '') {
            $stmt = $db->prepare("SELECT id FROM inventory_items WHERE sku = ? AND sku IS NOT NULL AND sku != ''");
            $stmt->execute([trim($sku)]);
            if ($stmt->fetch()) {
                Response::error('SKU already exists. Please use a different SKU or leave it empty.', 409);
            }
        }

        // Handle file upload
        $imagePath = null;
        if ($isMultipart && isset($_FILES['image'])) {
            $file = $_FILES['image'];
            
            // Check upload error code
            if ($file['error'] !== UPLOAD_ERR_OK) {
                $errorMessages = [
                    UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize directive in php.ini',
                    UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE directive in HTML form',
                    UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                    UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                    UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                    UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                    UPLOAD_ERR_EXTENSION => 'File upload stopped by extension'
                ];
                $errorMsg = $errorMessages[$file['error']] ?? 'Unknown upload error';
                error_log("Upload error code: " . $file['error'] . " - " . $errorMsg);
                Response::error('File upload error: ' . $errorMsg, 400);
            }
            
            error_log("Processing image upload: " . $file['name'] . " (" . $file['size'] . " bytes)");
            
            // Validate file type
            $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            $fileType = mime_content_type($file['tmp_name']);
            
            if (!in_array($fileType, $allowedTypes)) {
                Response::error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.', 400);
            }
            
            // Validate file size (5MB max)
            if ($file['size'] > UPLOAD_MAX_SIZE) {
                Response::error('File size exceeds maximum allowed size of 5MB', 400);
            }
            
            // Create uploads/parts directory (matching server structure)
            // Try both locations for compatibility
            $uploadDir = __DIR__ . '/../uploads/parts/';
            $altUploadDir = __DIR__ . '/../images/uploads/parts/';
            
            // Use the uploads/parts directory (matching server structure)
            if (!is_dir($uploadDir)) {
                if (!mkdir($uploadDir, 0755, true)) {
                    // Fallback to images/uploads/parts if uploads/parts fails
                    if (!is_dir($altUploadDir)) {
                        if (!mkdir($altUploadDir, 0755, true)) {
                            error_log("Failed to create upload directory: " . $uploadDir);
                            Response::error('Failed to create upload directory. Please check server permissions.', 500);
                        }
                    }
                    $uploadDir = $altUploadDir;
                }
            }
            
            // Verify directory is writable
            if (!is_writable($uploadDir)) {
                error_log("Upload directory is not writable: " . $uploadDir);
                Response::error('Upload directory is not writable. Please check server permissions.', 500);
            }
            
            // Generate unique filename
            $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            
            // Normalize common image extensions
            $extensionMap = [
                'jpg' => 'jpg',
                'jpeg' => 'jpg',
                'png' => 'png',
                'gif' => 'gif',
                'webp' => 'webp'
            ];
            
            // Handle incomplete extensions (e.g., 'jp' -> 'jpg')
            if ($fileExtension === 'jp') {
                $fileExtension = 'jpg';
            } elseif (!isset($extensionMap[$fileExtension])) {
                // If extension is not recognized, try to determine from MIME type
                if ($fileType === 'image/jpeg' || $fileType === 'image/jpg') {
                    $fileExtension = 'jpg';
                } elseif ($fileType === 'image/png') {
                    $fileExtension = 'png';
                } elseif ($fileType === 'image/gif') {
                    $fileExtension = 'gif';
                } else {
                    $fileExtension = 'jpg'; // Default fallback
                }
            } else {
                $fileExtension = $extensionMap[$fileExtension];
            }
            
            $fileName = uniqid('part_', true) . '.' . $fileExtension;
            $filePath = $uploadDir . $fileName;
            
            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $filePath)) {
                // Verify file was actually moved
                if (!file_exists($filePath)) {
                    error_log("File upload failed: File does not exist after move_uploaded_file. Path: " . $filePath);
                    Response::error('File upload failed: File was not saved correctly.', 500);
                }
                
                // Store relative path matching server structure (uploads/parts/)
                // Check which directory was used
                if (strpos($uploadDir, '/uploads/parts/') !== false) {
                    $imagePath = 'uploads/parts/' . $fileName;
                } else {
                    $imagePath = 'images/uploads/parts/' . $fileName;
                }
                error_log("Image uploaded successfully: " . $imagePath);
            } else {
                $errorMsg = 'Failed to upload image';
                $lastError = error_get_last();
                if ($lastError) {
                    $errorMsg .= ': ' . $lastError['message'];
                    error_log("move_uploaded_file failed: " . $lastError['message']);
                    error_log("Source: " . $file['tmp_name']);
                    error_log("Destination: " . $filePath);
                }
                Response::error($errorMsg, 500);
            }
        } elseif (isset($data['image']) && !empty($data['image'])) {
            // Handle base64 or URL image
            $imagePath = Request::sanitize($data['image']);
        }

        // Build insert query with new fields
        $fields = ['name', 'name_khmer', 'part_plate', 'sku', 'current_stock', 'min_stock', 'max_stock', 'unit_price', 'supplier', 'last_restocked'];
        $placeholders = [];
        $values = [];
        
        // Add category_id if provided
        if ($categoryId) {
            $fields[] = 'category_id';
        }
        
        // Add vehicle_model_id if provided
        if ($vehicleModelId) {
            $fields[] = 'vehicle_model_id';
        }
        
        // Add image if uploaded
        if ($imagePath) {
            $fields[] = 'image';
        }
        
        $fields[] = 'created_at';
        $fields[] = 'updated_at';
        
        foreach ($fields as $field) {
            if ($field === 'created_at' || $field === 'updated_at') {
                $placeholders[] = 'NOW()';
            } else {
                $placeholders[] = '?';
            }
        }
        
        $sql = "INSERT INTO inventory_items (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
        
        $stmt = $db->prepare($sql);
        
        // Prepare values array
        $values = [
            $name,
            $nameKhmer ?: null,
            $partPlate ?: null,
            $sku ?: null,
            $currentStock,
            $minStock,
            $maxStock,
            $unitPrice,
            $supplier ?: null,
            $lastRestocked
        ];
        
        // Add category_id if provided
        if ($categoryId) {
            $values[] = $categoryId;
        }
        
        // Add vehicle_model_id if provided
        if ($vehicleModelId) {
            $values[] = $vehicleModelId;
        }
        
        // Add image if uploaded
        if ($imagePath) {
            $values[] = $imagePath;
        }
        
        $stmt->execute($values);

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
