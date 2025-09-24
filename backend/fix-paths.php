<?php
/**
 * Fix API File Paths Script
 * Updates all require_once statements to use correct relative paths
 */

$apiDir = __DIR__ . '/api';

// Files that need path fixes
$filesToFix = [
    // Auth files (already fixed login.php, logout.php, register.php)
    'auth/me.php' => [
        'old' => "require_once __DIR__ . '/../../config/config.php';",
        'new' => "require_once __DIR__ . '/../../config/config.php';"
    ],

    // Main API files
    'health.php' => [
        'old' => "require_once __DIR__ . '/../config/database.php';",
        'new' => "require_once __DIR__ . '/../config/database.php';"
    ],

    'customers.php' => [
        'old' => "require_once __DIR__ . '/../config/database.php';",
        'new' => "require_once __DIR__ . '/../config/database.php';"
    ],

    'vehicles.php' => [
        'old' => "require_once __DIR__ . '/../config/database.php';",
        'new' => "require_once __DIR__ . '/../config/database.php';"
    ],

    'services.php' => [
        'old' => "require_once __DIR__ . '/../config/database.php';",
        'new' => "require_once __DIR__ . '/../config/database.php';"
    ],

    'bookings.php' => [
        'old' => "require_once __DIR__ . '/../config/database.php';",
        'new' => "require_once __DIR__ . '/../config/database.php';"
    ],

    'inventory.php' => [
        'old' => "require_once __DIR__ . '/../config/database.php';",
        'new' => "require_once __DIR__ . '/../config/database.php';"
    ],

    'staff.php' => [
        'old' => "require_once __DIR__ . '/../config/database.php';",
        'new' => "require_once __DIR__ . '/../config/database.php';"
    ],

    'warranties.php' => [
        'old' => "require_once __DIR__ . '/../config/database.php';",
        'new' => "require_once __DIR__ . '/../config/database.php';"
    ],

    'alerts.php' => [
        'old' => "require_once __DIR__ . '/../config/database.php';",
        'new' => "require_once __DIR__ . '/../config/database.php';"
    ],

    'notifications.php' => [
        'old' => "require_once __DIR__ . '/../config/database.php';",
        'new' => "require_once __DIR__ . '/../config/database.php';"
    ],

    'settings.php' => [
        'old' => "require_once __DIR__ . '/../config/database.php';",
        'new' => "require_once __DIR__ . '/../config/database.php';"
    ],

    'service-types.php' => [
        'old' => "require_once __DIR__ . '/../config/database.php';",
        'new' => "require_once __DIR__ . '/../config/database.php';"
    ],

    // Dashboard files
    'dashboard/stats.php' => [
        'old' => "require_once __DIR__ . '/../../config/database.php';",
        'new' => "require_once __DIR__ . '/../../config/database.php';"
    ],

    'dashboard/analytics.php' => [
        'old' => "require_once __DIR__ . '/../../config/database.php';",
        'new' => "require_once __DIR__ . '/../../config/database.php';"
    ],

    // Reports files
    'reports/summary.php' => [
        'old' => "require_once __DIR__ . '/../../config/database.php';",
        'new' => "require_once __DIR__ . '/../../config/database.php';"
    ],

    'reports/customer.php' => [
        'old' => "require_once __DIR__ . '/../../config/database.php';",
        'new' => "require_once __DIR__ . '/../../config/database.php';"
    ],

    'reports/warranty.php' => [
        'old' => "require_once __DIR__ . '/../../config/database.php';",
        'new' => "require_once __DIR__ . '/../../config/database.php';"
    ]
];

echo "<h2>API Path Fix Script</h2>";

foreach ($filesToFix as $file => $fixes) {
    $filePath = $apiDir . '/' . $file;

    if (file_exists($filePath)) {
        echo "Processing: $file<br>";

        $content = file_get_contents($filePath);
        $originalContent = $content;

        foreach ($fixes as $old => $new) {
            $content = str_replace($old, $new, $content);
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

echo "<h3>Script Complete</h3>";
?>
