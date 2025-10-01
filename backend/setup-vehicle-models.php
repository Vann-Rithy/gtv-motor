<?php
/**
 * Quick Vehicle Models Setup Test
 */

// Set production environment for testing
$_ENV['DB_HOST'] = 'localhost';
$_ENV['DB_NAME'] = 'gtvmnwkc_db';
$_ENV['DB_USER'] = 'gtvmnwkc_admin';
$_ENV['DB_PASSWORD'] = '}dSNZYD@@b40';
$_ENV['DB_PORT'] = '3306';

require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "Database connection: SUCCESS\n";

    // Check if vehicle_models table exists
    $stmt = $db->prepare("SHOW TABLES LIKE 'vehicle_models'");
    $stmt->execute();
    $tableExists = $stmt->fetch();

    if ($tableExists) {
        echo "vehicle_models table: EXISTS\n";

        // Check data count
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM vehicle_models");
        $stmt->execute();
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Records count: {$count['count']}\n";

        if ($count['count'] == 0) {
            echo "Table is empty, populating with GTV models...\n";

            // Insert GTV models
            $models = [
                ['SOBEN', 'Compact Entry SUV - Modern design with safety features', 'Compact SUV', 19999.00, 60, 15000, 2, '1.5L Petrol', 1500, 'Petrol', 'CVT'],
                ['CAESAR', 'Mid-level SUV - Caesar and Caesar-Pro variants', 'Mid-level SUV', 26999.00, 70, 17000, 3, '1.5L Turbo', 1500, 'Petrol', 'Automatic'],
                ['KAIN', 'Premium SUV - Flagship model with luxury features', 'Premium SUV', 34950.00, 90, 20000, 3, '1.5T / 2.0T Turbo', 1500, 'Petrol', 'Automatic'],
                ['KRUSAR', 'Dual-cab Pick-up Truck - Utility vehicle', 'Pick-up Truck', 27999.00, 75, 18000, 3, '2.0T Turbo', 2000, 'Petrol', 'Manual/Automatic'],
                ['SOBEN-P', 'MPV Multi-purpose Vehicle - Family van', 'MPV', 21999.00, 65, 16000, 2, '1.5L Petrol', 1500, 'Petrol', 'CVT']
            ];

            $stmt = $db->prepare("
                INSERT INTO vehicle_models (
                    name, description, category, base_price, estimated_duration,
                    warranty_km_limit, warranty_max_services, engine_type, cc_displacement,
                    fuel_type, transmission, is_active, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
            ");

            foreach ($models as $model) {
                $stmt->execute($model);
                echo "Inserted: {$model[0]}\n";
            }

            echo "GTV models populated successfully!\n";
        } else {
            // Show existing data
            $stmt = $db->prepare("SELECT id, name, category FROM vehicle_models ORDER BY name");
            $stmt->execute();
            $models = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo "Existing models:\n";
            foreach ($models as $model) {
                echo "- ID: {$model['id']}, Name: {$model['name']}, Category: {$model['category']}\n";
            }
        }

    } else {
        echo "vehicle_models table: NOT EXISTS - Creating table...\n";

        // Create table
        $createTable = "
            CREATE TABLE vehicle_models (
                id int(11) NOT NULL AUTO_INCREMENT,
                name varchar(100) NOT NULL,
                description text DEFAULT NULL,
                category varchar(50) DEFAULT 'SUV',
                base_price decimal(10,2) DEFAULT 0.00,
                estimated_duration int(11) DEFAULT 60,
                warranty_km_limit int(11) DEFAULT 15000,
                warranty_max_services int(11) DEFAULT 2,
                engine_type varchar(50) DEFAULT 'Petrol',
                cc_displacement int(11) DEFAULT NULL,
                fuel_type varchar(20) DEFAULT 'Petrol',
                transmission varchar(20) DEFAULT 'Automatic',
                color_options text DEFAULT NULL,
                year_range varchar(20) DEFAULT NULL,
                specifications text DEFAULT NULL,
                is_active tinyint(1) NOT NULL DEFAULT 1,
                created_at timestamp NOT NULL DEFAULT current_timestamp(),
                updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                PRIMARY KEY (id),
                UNIQUE KEY unique_name (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        ";

        $db->exec($createTable);
        echo "Table created successfully!\n";

        // Populate with GTV models
        $models = [
            ['SOBEN', 'Compact Entry SUV - Modern design with safety features', 'Compact SUV', 19999.00, 60, 15000, 2, '1.5L Petrol', 1500, 'Petrol', 'CVT'],
            ['CAESAR', 'Mid-level SUV - Caesar and Caesar-Pro variants', 'Mid-level SUV', 26999.00, 70, 17000, 3, '1.5L Turbo', 1500, 'Petrol', 'Automatic'],
            ['KAIN', 'Premium SUV - Flagship model with luxury features', 'Premium SUV', 34950.00, 90, 20000, 3, '1.5T / 2.0T Turbo', 1500, 'Petrol', 'Automatic'],
            ['KRUSAR', 'Dual-cab Pick-up Truck - Utility vehicle', 'Pick-up Truck', 27999.00, 75, 18000, 3, '2.0T Turbo', 2000, 'Petrol', 'Manual/Automatic'],
            ['SOBEN-P', 'MPV Multi-purpose Vehicle - Family van', 'MPV', 21999.00, 65, 16000, 2, '1.5L Petrol', 1500, 'Petrol', 'CVT']
        ];

        $stmt = $db->prepare("
            INSERT INTO vehicle_models (
                name, description, category, base_price, estimated_duration,
                warranty_km_limit, warranty_max_services, engine_type, cc_displacement,
                fuel_type, transmission, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
        ");

        foreach ($models as $model) {
            $stmt->execute($model);
            echo "Inserted: {$model[0]}\n";
        }

        echo "GTV models populated successfully!\n";
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>

