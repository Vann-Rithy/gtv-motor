<?php
/**
 * Warranty Configuration Setup Script
 * GTV Motor - Automated Warranty Management System Setup
 */

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';

try {
    echo "=== GTV Motor Warranty Configuration Setup ===\n\n";
    
    $database = new Database();
    $db = $database->getConnection();
    
    echo "✓ Database connection established\n";
    
    // Read and execute the warranty configuration SQL
    $sqlFile = __DIR__ . '/create_warranty_configuration_system.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("SQL file not found: {$sqlFile}");
    }
    
    $sql = file_get_contents($sqlFile);
    if (!$sql) {
        throw new Exception("Failed to read SQL file");
    }
    
    echo "✓ SQL file loaded\n";
    
    // Split SQL into individual statements
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($statements as $statement) {
        if (empty($statement) || strpos($statement, '--') === 0) {
            continue;
        }
        
        try {
            $db->exec($statement);
            $successCount++;
            
            // Show progress for major operations
            if (strpos($statement, 'CREATE TABLE') !== false) {
                preg_match('/CREATE TABLE.*?`(\w+)`/', $statement, $matches);
                if (isset($matches[1])) {
                    echo "✓ Created table: {$matches[1]}\n";
                }
            } elseif (strpos($statement, 'INSERT INTO') !== false) {
                preg_match('/INSERT INTO.*?`(\w+)`/', $statement, $matches);
                if (isset($matches[1])) {
                    echo "✓ Inserted data into: {$matches[1]}\n";
                }
            } elseif (strpos($statement, 'ALTER TABLE') !== false) {
                preg_match('/ALTER TABLE.*?`(\w+)`/', $statement, $matches);
                if (isset($matches[1])) {
                    echo "✓ Updated table: {$matches[1]}\n";
                }
            }
            
        } catch (Exception $e) {
            $errorCount++;
            echo "✗ Error executing statement: " . substr($statement, 0, 50) . "...\n";
            echo "  Error: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n=== Setup Summary ===\n";
    echo "✓ Successful operations: {$successCount}\n";
    echo "✗ Failed operations: {$errorCount}\n";
    
    if ($errorCount === 0) {
        echo "\n🎉 Warranty configuration system setup completed successfully!\n\n";
        
        // Test the system
        echo "=== Testing Warranty System ===\n";
        
        // Test 1: Check if tables exist
        $tables = ['warranty_components', 'vehicle_model_warranties', 'vehicle_models'];
        foreach ($tables as $table) {
            $stmt = $db->prepare("SHOW TABLES LIKE ?");
            $stmt->execute([$table]);
            if ($stmt->fetch()) {
                echo "✓ Table '{$table}' exists\n";
            } else {
                echo "✗ Table '{$table}' missing\n";
            }
        }
        
        // Test 2: Check warranty components
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM warranty_components WHERE is_active = 1");
        $stmt->execute();
        $componentCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "✓ Warranty components: {$componentCount}\n";
        
        // Test 3: Check vehicle models with warranty data
        $stmt = $db->prepare("
            SELECT COUNT(*) as count 
            FROM vehicle_models 
            WHERE is_active = 1 
            AND warranty_engine_years IS NOT NULL
        ");
        $stmt->execute();
        $modelCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "✓ Vehicle models with warranty data: {$modelCount}\n";
        
        // Test 4: Check warranty configurations
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM vehicle_model_warranties");
        $stmt->execute();
        $configCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "✓ Warranty configurations: {$configCount}\n";
        
        // Test 5: Show sample warranty data
        echo "\n=== Sample Warranty Data ===\n";
        $stmt = $db->prepare("
            SELECT 
                vm.name as model_name,
                vm.warranty_engine_years,
                vm.warranty_engine_km,
                vm.has_hybrid_battery,
                vm.warranty_battery_years
            FROM vehicle_models vm
            WHERE vm.is_active = 1
            ORDER BY vm.name
            LIMIT 3
        ");
        $stmt->execute();
        $samples = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($samples as $sample) {
            echo "Model: {$sample['model_name']}\n";
            echo "  Engine: {$sample['warranty_engine_years']} years / " . number_format($sample['warranty_engine_km']) . " km\n";
            echo "  Hybrid Battery: " . ($sample['has_hybrid_battery'] ? 'Yes (' . $sample['warranty_battery_years'] . ' years)' : 'No') . "\n";
            echo "\n";
        }
        
        echo "=== Next Steps ===\n";
        echo "1. Access the warranty configuration interface at: /warranty-configuration\n";
        echo "2. Test the API endpoints:\n";
        echo "   - GET /api/warranty-configuration (list all configurations)\n";
        echo "   - GET /api/warranty-configuration/components (list components)\n";
        echo "   - GET /api/warranty-configuration/model/{id} (get model details)\n";
        echo "3. Use the enhanced vehicles API for automatic warranty assignment\n";
        echo "4. Create vehicles with auto_assign_warranty=true to test automatic assignment\n\n";
        
    } else {
        echo "\n⚠️  Setup completed with errors. Please review the errors above.\n";
    }
    
} catch (Exception $e) {
    echo "✗ Setup failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
