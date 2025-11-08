<?php
/**
 * Image Serving Endpoint
 * Serves uploaded images from the backend uploads directory
 */

// Get the image path from URL
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove base path if exists
$basePath = '/backend';
if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
}

// Extract image path from URL (e.g., /api/images/uploads/part/filename.jpg)
$imagePath = null;
if (preg_match('#/api/images/(.+)$#', $path, $matches)) {
    $imagePath = $matches[1];
}

if (!$imagePath) {
    http_response_code(404);
    die('Image not found - no path extracted');
}

// Security: prevent directory traversal
$imagePath = str_replace('..', '', $imagePath);
$imagePath = ltrim($imagePath, '/');

// Debug logging
error_log("Image request - URI: " . $requestUri);
error_log("Image request - Path: " . $path);
error_log("Image request - Extracted path: " . $imagePath);

// Full file path - handle different path structures
$fullPath = __DIR__ . '/../' . $imagePath;

// Try multiple path variations
$possiblePaths = [];

// Add the original path
$possiblePaths[] = $fullPath;

// Handle path variations: uploads/parts/, images/uploads/parts/
if (strpos($imagePath, 'uploads/parts/') === 0) {
    // Already correct - use as-is
    // Also try images/uploads/parts/ for backward compatibility
    $partsPath = str_replace('uploads/parts/', 'images/uploads/parts/', $imagePath);
    $possiblePaths[] = __DIR__ . '/../' . $partsPath;
} elseif (strpos($imagePath, 'images/uploads/parts/') === 0) {
    // Convert images/uploads/parts/ to uploads/parts/
    $partsPath = str_replace('images/uploads/parts/', 'uploads/parts/', $imagePath);
    $possiblePaths[] = __DIR__ . '/../' . $partsPath;
} elseif (strpos($imagePath, 'images/uploads/') === 0) {
    // Convert images/uploads/ to uploads/
    $uploadPath = str_replace('images/uploads/', 'uploads/', $imagePath);
    $possiblePaths[] = __DIR__ . '/../' . $uploadPath;
} elseif (strpos($imagePath, 'uploads/part/') === 0) {
    // Handle old singular 'part' path - convert to plural 'parts'
    $partsPath = str_replace('uploads/part/', 'uploads/parts/', $imagePath);
    $possiblePaths[] = __DIR__ . '/../' . $partsPath;
    // Also try images/uploads/parts/ for backward compatibility
    $partsPath2 = str_replace('uploads/part/', 'images/uploads/parts/', $imagePath);
    $possiblePaths[] = __DIR__ . '/../' . $partsPath2;
}

// Try each possible path
$found = false;
foreach ($possiblePaths as $tryPath) {
    if (file_exists($tryPath) && is_file($tryPath)) {
        $fullPath = $tryPath;
        $found = true;
        break;
    }
}

// If still not found, try common extensions
if (!$found) {
    foreach ($possiblePaths as $basePath) {
        $pathInfo = pathinfo($basePath);
        $commonExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        foreach ($commonExtensions as $ext) {
            $tryPath = $pathInfo['dirname'] . '/' . $pathInfo['filename'] . '.' . $ext;
            if (file_exists($tryPath) && is_file($tryPath)) {
                $fullPath = $tryPath;
                $found = true;
                break 2;
            }
        }
    }
}

if (!$found) {
    // Log for debugging
    error_log("Image not found. Requested path: " . $imagePath);
    error_log("Tried paths: " . implode(", ", $possiblePaths));
    
    // Check if uploads directory exists
    $uploadsDir = __DIR__ . '/../uploads';
    $imagesDir = __DIR__ . '/../images';
    error_log("Uploads dir exists: " . (is_dir($uploadsDir) ? 'YES' : 'NO') . " - " . $uploadsDir);
    error_log("Images dir exists: " . (is_dir($imagesDir) ? 'YES' : 'NO') . " - " . $imagesDir);
    
    if (is_dir($uploadsDir)) {
        $partsDir = $uploadsDir . '/parts';
        error_log("Parts dir exists: " . (is_dir($partsDir) ? 'YES' : 'NO') . " - " . $partsDir);
        if (is_dir($partsDir)) {
            $files = scandir($partsDir);
            error_log("Files in parts dir: " . implode(", ", array_slice($files, 2)));
        }
        // Also check old singular 'part' directory
        $partDir = $uploadsDir . '/part';
        if (is_dir($partDir)) {
            error_log("Part dir (singular) exists: YES - " . $partDir);
        }
    }
    
    http_response_code(404);
    die('Image not found: ' . basename($imagePath));
}

// Verify file is within uploads directory (main directory)
$realPath = realpath($fullPath);
$uploadsDir = realpath(__DIR__ . '/../uploads');
$imagesDir = realpath(__DIR__ . '/../images');

$allowed = false;
if ($uploadsDir && strpos($realPath, $uploadsDir) === 0) {
    $allowed = true; // Primary location: uploads/parts/
} elseif ($imagesDir && strpos($realPath, $imagesDir) === 0) {
    $allowed = true; // Backward compatibility: images/uploads/parts/
}

if (!$allowed) {
    http_response_code(403);
    die('Access denied');
}

// Get file extension and set appropriate content type
$extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
$contentTypes = [
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'gif' => 'image/gif',
    'webp' => 'image/webp'
];

$contentType = $contentTypes[$extension] ?? 'application/octet-stream';

// Set headers
header('Content-Type: ' . $contentType);
header('Content-Length: ' . filesize($fullPath));
header('Cache-Control: public, max-age=31536000'); // Cache for 1 year

// Output file
readfile($fullPath);
exit;
?>

