<?php
/**
 * Simple Test API
 * Test if basic PHP structure works
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Request.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    Response::success(['test' => 'Hello World'], 'Test successful');
} catch (Exception $e) {
    Response::error('Test failed: ' . $e->getMessage(), 500);
}
?>
