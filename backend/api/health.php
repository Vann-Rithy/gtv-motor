<?php
/**
 * Health Check API
 * GTV Motor PHP Backend
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $healthReport = [
        'timestamp' => date('c'),
        'database' => [
            'connection' => false,
            'tables' => [],
            'errors' => []
        ]
    ];
    
    // Test database connection
    try {
        $stmt = $db->query("SELECT 1 as test");
        $healthReport['database']['connection'] = true;
    } catch (Exception $e) {
        $healthReport['database']['connection'] = false;
        $healthReport['database']['errors'][] = "Connection failed: " . $e->getMessage();
    }
    
    // Check if tables exist and are accessible
    $tablesToCheck = [
        'services',
        'service_types',
        'vehicles',
        'customers',
        'inventory_items',
        'bookings',
        'warranties',
        'users',
        'staff'
    ];
    
    foreach ($tablesToCheck as $tableName) {
        try {
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM {$tableName}");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $count = $result['count'] ?? 0;
            
            $healthReport['database']['tables'][$tableName] = [
                'exists' => true,
                'accessible' => true,
                'recordCount' => (int)$count
            ];
        } catch (Exception $e) {
            $healthReport['database']['tables'][$tableName] = [
                'exists' => false,
                'accessible' => false,
                'error' => $e->getMessage()
            ];
            $healthReport['database']['errors'][] = "Table {$tableName}: " . $e->getMessage();
        }
    }
    
    // Check table structures
    $structureChecks = [
        [
            'table' => 'services',
            'required_columns' => ['id', 'invoice_number', 'customer_id', 'vehicle_id', 'service_type_id', 'service_date', 'total_amount']
        ],
        [
            'table' => 'customers',
            'required_columns' => ['id', 'name', 'phone', 'created_at']
        ],
        [
            'table' => 'vehicles',
            'required_columns' => ['id', 'customer_id', 'plate_number', 'model', 'created_at']
        ]
    ];
    
    foreach ($structureChecks as $check) {
        try {
            $stmt = $db->prepare("DESCRIBE {$check['table']}");
            $stmt->execute();
            $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $missingColumns = array_diff($check['required_columns'], $columns);
            if (empty($missingColumns)) {
                $healthReport['database']['tables'][$check['table']]['structure'] = 'OK';
            } else {
                $healthReport['database']['tables'][$check['table']]['structure'] = 'Missing columns: ' . implode(', ', $missingColumns);
                $healthReport['database']['errors'][] = "Table {$check['table']} missing columns: " . implode(', ', $missingColumns);
            }
        } catch (Exception $e) {
            $healthReport['database']['tables'][$check['table']]['structure'] = 'Error: ' . $e->getMessage();
            $healthReport['database']['errors'][] = "Table {$check['table']} structure check failed: " . $e->getMessage();
        }
    }
    
    // Overall health status
    $isHealthy = $healthReport['database']['connection'] && empty($healthReport['database']['errors']);
    $healthReport['status'] = $isHealthy ? 'healthy' : 'unhealthy';
    
    if ($isHealthy) {
        Response::success($healthReport, 'System is healthy');
    } else {
        Response::error('System health check failed', 500, $healthReport);
    }
    
} catch (Exception $e) {
    Response::error('Health check failed', 500, ['error' => $e->getMessage()]);
}
?>
