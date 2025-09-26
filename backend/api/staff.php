<?php
/**
 * Staff API
 * GTV Motor PHP Backend - Updated for Token Authentication
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Request.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    // No authentication required - Developer Mode

    $method = Request::method();

    if ($method === 'GET') {
        // Return simplified staff data for now
        $staff = [
            [
                'id' => 1,
                'name' => 'John Doe',
                'role' => 'technician',
                'phone' => '+1234567890',
                'email' => 'john@gtvmotor.com',
                'department' => 'Service',
                'active' => true,
                'service_count' => 0,
                'sales_count' => 0
            ],
            [
                'id' => 2,
                'name' => 'Jane Smith',
                'role' => 'service_advisor',
                'phone' => '+1234567891',
                'email' => 'jane@gtvmotor.com',
                'department' => 'Sales',
                'active' => true,
                'service_count' => 0,
                'sales_count' => 0
            ]
        ];

        Response::success($staff, 'Staff retrieved successfully');

    } else {
        Response::error('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Staff API error: " . $e->getMessage());
    Response::error('Failed to process staff request', 500);
}
?>
