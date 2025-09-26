<?php
/**
 * Authentication Logout API - No Authentication Required
 * GTV Motor PHP Backend - Developer Mode
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/Request.php';
require_once __DIR__ . '/../../includes/Response.php';

try {
    // Always return success without authentication
    Response::success(null, 'Logout successful');

} catch (Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    Response::error('Logout failed', 500);
}
?>
