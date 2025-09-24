<?php
/**
 * Direct Me Endpoint Test
 * Test the /api/auth/me endpoint directly
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Direct /api/auth/me Test</h2>";

// Set up the request
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/auth/me';

echo "<h3>Testing /api/auth/me endpoint...</h3>";

try {
    // Capture output
    ob_start();

    // Include the me.php file
    include __DIR__ . '/api/auth/me.php';

    // Get the output
    $output = ob_get_clean();

    echo "<h3>Response:</h3>";
    echo "<pre>" . htmlspecialchars($output) . "</pre>";

} catch (Exception $e) {
    echo "<h3>Error:</h3>";
    echo "<p style='color: red;'>" . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<h3>Stack Trace:</h3>";
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
} catch (Error $e) {
    echo "<h3>Fatal Error:</h3>";
    echo "<p style='color: red;'>" . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<h3>Stack Trace:</h3>";
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}

echo "<h3>Test Complete</h3>";
?>
