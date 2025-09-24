<?php
/**
 * Simple Backend Test
 * Test the PHP backend without external dependencies
 */

echo "🧪 Testing GTV Motor Backend\n";
echo "============================\n\n";

// Test 1: Check if .env file exists
echo "1. Checking .env file...\n";
if (file_exists('backend/.env')) {
    echo "   ✅ .env file exists\n";
} else {
    echo "   ❌ .env file missing\n";
    echo "   Creating .env file...\n";
    
    $envContent = "APP_ENV=development\nAPP_DEBUG=true\nDB_HOST=localhost\nDB_NAME=gtv_motor_php\nDB_USER=root\nDB_PASSWORD=\nDB_PORT=3306\nJWT_SECRET=your-local-secret-key-123\n";
    file_put_contents('backend/.env', $envContent);
    echo "   ✅ .env file created\n";
}

// Test 2: Check if backend files exist
echo "\n2. Checking backend files...\n";
$requiredFiles = [
    'backend/index.php',
    'backend/config/config.php',
    'backend/config/database.php',
    'backend/includes/Response.php',
    'backend/includes/Request.php',
    'backend/includes/Auth.php',
    'backend/api/health.php'
];

$allFilesExist = true;
foreach ($requiredFiles as $file) {
    if (file_exists($file)) {
        echo "   ✅ $file\n";
    } else {
        echo "   ❌ $file missing\n";
        $allFilesExist = false;
    }
}

if ($allFilesExist) {
    echo "   ✅ All required files exist\n";
} else {
    echo "   ❌ Some files are missing\n";
}

// Test 3: Test basic PHP functionality
echo "\n3. Testing PHP functionality...\n";
try {
    // Test if we can include the config
    require_once 'backend/config/config.php';
    echo "   ✅ Config loaded successfully\n";
    
    // Test if we can create a Response object
    require_once 'backend/includes/Response.php';
    echo "   ✅ Response class loaded\n";
    
} catch (Exception $e) {
    echo "   ❌ PHP error: " . $e->getMessage() . "\n";
}

echo "\n🎉 Backend test complete!\n";
echo "\nNext steps:\n";
echo "1. Start XAMPP (Apache + MySQL)\n";
echo "2. Copy backend to C:\\xampp\\htdocs\\backend\n";
echo "3. Create database 'gtv_motor_php' in phpMyAdmin\n";
echo "4. Import backend/database/schema.sql\n";
echo "5. Test: http://localhost/backend/api/health\n";
echo "\n";
?>
