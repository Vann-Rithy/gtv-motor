<?php
// Simple test endpoint
header('Content-Type: application/json');
echo json_encode([
    'message' => 'PHP Backend is working!',
    'timestamp' => date('Y-m-d H:i:s'),
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
    'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown'
]);
?>






