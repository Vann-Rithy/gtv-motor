<?php
/**
 * Fix Request Class Includes
 * Add Request.php include to all API files that use Request class
 */

$apiDir = __DIR__ . '/api';

// Files that use Request class but don't include it
$filesToFix = [
    'customers.php',
    'vehicles.php',
    'services.php',
    'bookings.php',
    'inventory.php',
    'staff.php',
    'warranties.php',
    'alerts.php',
    'notifications.php',
    'settings.php',
    'service-types.php',
    'dashboard/stats.php',
    'dashboard/analytics.php',
    'reports/summary.php',
    'reports/customer.php',
    'reports/warranty.php'
];

echo "<h2>Fixing Request Class Includes</h2>";

foreach ($filesToFix as $file) {
    $filePath = $apiDir . '/' . $file;

    if (file_exists($filePath)) {
        echo "Processing: $file<br>";

        $content = file_get_contents($filePath);
        $originalContent = $content;

        // Check if Request.php is already included
        if (strpos($content, "require_once __DIR__ . '/../../includes/Request.php';") !== false ||
            strpos($content, "require_once __DIR__ . '/../includes/Request.php';") !== false) {
            echo "ℹ️ Request.php already included: $file<br>";
            continue;
        }

        // Add Request.php include after the first require_once
        $pattern = '/(require_once __DIR__ \. \'\/\.\.\/config\/database\.php\';)/';
        $replacement = '$1' . "\nrequire_once __DIR__ . '/../includes/Request.php';";

        $content = preg_replace($pattern, $replacement, $content, 1);

        // If no database.php include, add after first require_once
        if ($content === $originalContent) {
            $pattern = '/(require_once __DIR__ \. \'\/\.\.\/includes\/Auth\.php\';)/';
            $replacement = '$1' . "\nrequire_once __DIR__ . '/../../includes/Request.php';";
            $content = preg_replace($pattern, $replacement, $content, 1);
        }

        if ($content !== $originalContent) {
            file_put_contents($filePath, $content);
            echo "✅ Updated: $file<br>";
        } else {
            echo "ℹ️ No changes needed: $file<br>";
        }
    } else {
        echo "❌ File not found: $file<br>";
    }
}

echo "<h3>Fix Complete</h3>";
?>
