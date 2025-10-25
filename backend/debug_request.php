<?php
/**
 * Debug script to test what the backend receives
 */

// Test the Request::body() method
require_once 'includes/Request.php';

echo "=== DEBUG REQUEST BODY ===\n";

// Simulate what the backend receives
$testJson = '{"name":"thy","phone":"096 852 2285","email":null,"address":null}';
echo "Test JSON: " . $testJson . "\n";

// Test json_decode
$decoded = json_decode($testJson, true);
echo "Decoded data: " . print_r($decoded, true) . "\n";

// Test validation
if (isset($decoded['name']) && isset($decoded['phone'])) {
    echo "Fields exist: name=" . $decoded['name'] . ", phone=" . $decoded['phone'] . "\n";
} else {
    echo "Fields missing!\n";
    echo "Available keys: " . implode(', ', array_keys($decoded)) . "\n";
}

// Test empty check
foreach (['name', 'phone'] as $field) {
    if (!isset($decoded[$field]) || ($decoded[$field] !== 0 && $decoded[$field] !== '0' && empty($decoded[$field]))) {
        echo "Field '$field' is considered empty\n";
    } else {
        echo "Field '$field' is valid: " . $decoded[$field] . "\n";
    }
}

echo "=== END DEBUG ===\n";
?>

