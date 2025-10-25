<?php
/**
 * Populate Vehicle Models with Excel Warranty Data
 * Based on the warranty table provided by the user
 */

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "Populating vehicle models with Excel warranty data...\n";

    // Define warranty data from Excel file
    $vehicleModels = [
        'SOBEN' => [
            'warranty_engine_years' => 10,
            'warranty_engine_km' => 200000,
            'warranty_paint_years' => 10,
            'warranty_paint_km' => 200000,
            'warranty_transmission_years' => 5,
            'warranty_transmission_km' => 100000,
            'warranty_electrical_years' => 5,
            'warranty_electrical_km' => 100000,
            'warranty_battery_years' => 0,
            'warranty_battery_km' => 0,
            'has_hybrid_battery' => 0
        ],
        'KAIN 1.6T&2.0T' => [
            'warranty_engine_years' => 10,
            'warranty_engine_km' => 200000,
            'warranty_paint_years' => 10,
            'warranty_paint_km' => 200000,
            'warranty_transmission_years' => 5,
            'warranty_transmission_km' => 100000,
            'warranty_electrical_years' => 5,
            'warranty_electrical_km' => 100000,
            'warranty_battery_years' => 0,
            'warranty_battery_km' => 0,
            'has_hybrid_battery' => 0
        ],
        'KAIN PHEV' => [
            'warranty_engine_years' => 10,
            'warranty_engine_km' => 200000,
            'warranty_paint_years' => 10,
            'warranty_paint_km' => 200000,
            'warranty_transmission_years' => 5,
            'warranty_transmission_km' => 100000,
            'warranty_electrical_years' => 5,
            'warranty_electrical_km' => 100000,
            'warranty_battery_years' => 8,
            'warranty_battery_km' => 160000,
            'has_hybrid_battery' => 1
        ],
        'KESSOR' => [
            'warranty_engine_years' => 10,
            'warranty_engine_km' => 200000,
            'warranty_paint_years' => 10,
            'warranty_paint_km' => 200000,
            'warranty_transmission_years' => 5,
            'warranty_transmission_km' => 100000,
            'warranty_electrical_years' => 5,
            'warranty_electrical_km' => 100000,
            'warranty_battery_years' => 0,
            'warranty_battery_km' => 0,
            'has_hybrid_battery' => 0
        ],
        'KOUPREY' => [
            'warranty_engine_years' => 10,
            'warranty_engine_km' => 200000,
            'warranty_paint_years' => 10,
            'warranty_paint_km' => 200000,
            'warranty_transmission_years' => 5,
            'warranty_transmission_km' => 100000,
            'warranty_electrical_years' => 5,
            'warranty_electrical_km' => 100000,
            'warranty_battery_years' => 0,
            'warranty_battery_km' => 0,
            'has_hybrid_battery' => 0
        ],
        'KOUPREY ZNA' => [
            'warranty_engine_years' => 10,
            'warranty_engine_km' => 200000,
            'warranty_paint_years' => 10,
            'warranty_paint_km' => 200000,
            'warranty_transmission_years' => 5,
            'warranty_transmission_km' => 100000,
            'warranty_electrical_years' => 5,
            'warranty_electrical_km' => 100000,
            'warranty_battery_years' => 8,
            'warranty_battery_km' => 160000,
            'has_hybrid_battery' => 1
        ]
    ];

    foreach ($vehicleModels as $modelName => $warrantyData) {
        // Check if vehicle model exists
        $stmt = $db->prepare("SELECT id FROM vehicle_models WHERE name = ?");
        $stmt->execute([$modelName]);
        $model = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($model) {
            // Update existing model
            $stmt = $db->prepare("
                UPDATE vehicle_models SET 
                    warranty_engine_years = ?,
                    warranty_engine_km = ?,
                    warranty_paint_years = ?,
                    warranty_paint_km = ?,
                    warranty_transmission_years = ?,
                    warranty_transmission_km = ?,
                    warranty_electrical_years = ?,
                    warranty_electrical_km = ?,
                    warranty_battery_years = ?,
                    warranty_battery_km = ?,
                    has_hybrid_battery = ?,
                    updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([
                $warrantyData['warranty_engine_years'],
                $warrantyData['warranty_engine_km'],
                $warrantyData['warranty_paint_years'],
                $warrantyData['warranty_paint_km'],
                $warrantyData['warranty_transmission_years'],
                $warrantyData['warranty_transmission_km'],
                $warrantyData['warranty_electrical_years'],
                $warrantyData['warranty_electrical_km'],
                $warrantyData['warranty_battery_years'],
                $warrantyData['warranty_battery_km'],
                $warrantyData['has_hybrid_battery'],
                $model['id']
            ]);
            echo "Updated warranty data for model: $modelName (ID: {$model['id']})\n";
        } else {
            // Create new model
            $stmt = $db->prepare("
                INSERT INTO vehicle_models (
                    name, category, warranty_engine_years, warranty_engine_km,
                    warranty_paint_years, warranty_paint_km, warranty_transmission_years,
                    warranty_transmission_km, warranty_electrical_years, warranty_electrical_km,
                    warranty_battery_years, warranty_battery_km, has_hybrid_battery,
                    created_at, updated_at
                ) VALUES (?, 'SUV', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([
                $modelName,
                $warrantyData['warranty_engine_years'],
                $warrantyData['warranty_engine_km'],
                $warrantyData['warranty_paint_years'],
                $warrantyData['warranty_paint_km'],
                $warrantyData['warranty_transmission_years'],
                $warrantyData['warranty_transmission_km'],
                $warrantyData['warranty_electrical_years'],
                $warrantyData['warranty_electrical_km'],
                $warrantyData['warranty_battery_years'],
                $warrantyData['warranty_battery_km'],
                $warrantyData['has_hybrid_battery']
            ]);
            $modelId = $db->lastInsertId();
            echo "Created new model: $modelName (ID: $modelId)\n";
        }
    }

    echo "Excel warranty data population complete!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>






