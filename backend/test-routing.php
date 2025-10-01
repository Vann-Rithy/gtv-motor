<?php
/**
 * Test API Routing
 */

// Test the routing logic
$testPaths = [
    'api/vehicle-models',
    'api/vehicles',
    'api/customers',
    'api/services'
];

foreach ($testPaths as $path) {
    echo "Testing path: $path\n";

    // Simulate the routing logic from index.php
    $apiPath = substr($path, 4); // Remove 'api/' prefix
    echo "  API path: $apiPath\n";

    // Test the switch conditions
    if (strpos($apiPath, 'vehicle-models') === 0) {
        echo "  ✓ Matches vehicle-models route\n";
    } elseif (strpos($apiPath, 'vehicles') === 0) {
        echo "  ✓ Matches vehicles route\n";
    } elseif (strpos($apiPath, 'customers') === 0) {
        echo "  ✓ Matches customers route\n";
    } elseif (strpos($apiPath, 'services') === 0) {
        echo "  ✓ Matches services route\n";
    } else {
        echo "  ✗ No route match\n";
    }
    echo "\n";
}
?>

