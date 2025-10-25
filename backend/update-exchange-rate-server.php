<?php
/**
 * Exchange Rate Update Script
 * This script can be uploaded to the server and used to update exchange rates
 * Usage: Upload this file to your server and access it via web browser
 */

// Database configuration - adjust these for your server
$host = 'localhost';
$dbname = 'gtv_motor';
$username = 'root';
$password = '';

// Simple HTML interface
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>Update Exchange Rate</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .form-group { margin: 20px 0; }
            label { display: block; margin-bottom: 5px; font-weight: bold; color: #333; }
            input, select { padding: 12px; width: 100%; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; }
            button { padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin: 5px; }
            button:hover { background: #0056b3; }
            .result { margin: 20px 0; padding: 15px; border-radius: 4px; }
            .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
            h1 { color: #333; text-align: center; }
            .instructions { background: #e2e3e5; padding: 15px; border-radius: 4px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Update Exchange Rate</h1>
            
            <div class="instructions">
                <strong>Instructions:</strong><br>
                1. Select a service from the list below<br>
                2. Enter the current exchange rate (e.g., 4050)<br>
                3. Click "Update Exchange Rate"<br>
                4. The exchange rate will be saved to the database
            </div>
            
            <?php
            try {
                $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                // Get recent services
                $stmt = $pdo->prepare("
                    SELECT s.id, s.invoice_number, s.total_amount, s.exchange_rate, s.total_khr, 
                           c.name as customer_name, v.plate_number
                    FROM services s 
                    LEFT JOIN customers c ON s.customer_id = c.id 
                    LEFT JOIN vehicles v ON s.vehicle_id = v.id 
                    ORDER BY s.created_at DESC 
                    LIMIT 10
                ");
                $stmt->execute();
                $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if ($services) {
                    echo "<h3>Recent Services:</h3>";
                    echo "<table>";
                    echo "<tr><th>ID</th><th>Invoice</th><th>Customer</th><th>Vehicle</th><th>Total USD</th><th>Exchange Rate</th><th>Total KHR</th></tr>";
                    foreach ($services as $service) {
                        echo "<tr>";
                        echo "<td>" . htmlspecialchars($service['id']) . "</td>";
                        echo "<td>" . htmlspecialchars($service['invoice_number']) . "</td>";
                        echo "<td>" . htmlspecialchars($service['customer_name']) . "</td>";
                        echo "<td>" . htmlspecialchars($service['plate_number']) . "</td>";
                        echo "<td>$" . number_format($service['total_amount'], 2) . "</td>";
                        echo "<td>" . ($service['exchange_rate'] > 0 ? number_format($service['exchange_rate']) . " KHR" : "Not set") . "</td>";
                        echo "<td>" . ($service['total_khr'] > 0 ? number_format($service['total_khr']) . " KHR" : "Not calculated") . "</td>";
                        echo "</tr>";
                    }
                    echo "</table>";
                }
            } catch (PDOException $e) {
                echo "<div class='error'>Database connection failed: " . htmlspecialchars($e->getMessage()) . "</div>";
            }
            ?>
            
            <form method="POST">
                <div class="form-group">
                    <label for="serviceId">Service ID:</label>
                    <input type="number" id="serviceId" name="serviceId" placeholder="Enter service ID" required>
                </div>
                
                <div class="form-group">
                    <label for="exchangeRate">Exchange Rate (1 USD = KHR):</label>
                    <input type="number" id="exchangeRate" name="exchangeRate" placeholder="Enter exchange rate (e.g., 4050)" required>
                </div>
                
                <button type="submit">Update Exchange Rate</button>
            </form>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $serviceId = (int)$_POST['serviceId'];
    $exchangeRate = (float)$_POST['exchangeRate'];
    
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Check if service exists
        $stmt = $pdo->prepare("SELECT id, total_amount FROM services WHERE id = ?");
        $stmt->execute([$serviceId]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$service) {
            echo json_encode(['success' => false, 'error' => 'Service not found']);
            exit;
        }
        
        // Calculate total KHR
        $totalKhr = $service['total_amount'] * $exchangeRate;
        
        // Update exchange rate and total KHR
        $stmt = $pdo->prepare("UPDATE services SET exchange_rate = ?, total_khr = ?, updated_at = NOW() WHERE id = ?");
        $result = $stmt->execute([$exchangeRate, $totalKhr, $serviceId]);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Exchange rate updated successfully',
                'data' => [
                    'service_id' => $serviceId,
                    'exchange_rate' => $exchangeRate,
                    'total_khr' => $totalKhr,
                    'total_usd' => $service['total_amount']
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to update exchange rate']);
        }
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}
?>
