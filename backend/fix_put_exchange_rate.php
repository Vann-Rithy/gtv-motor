<?php
// Script to add exchange_rate handling to PUT method

$filePath = 'api/services.php';
$content = file_get_contents($filePath);

// Find the line with "Add service ID for WHERE clause" and insert before it
$pattern = '/(\$updateValues\[\] = \$serviceId; \/\/ Add service ID for WHERE clause)/';

$replacement = '        if (isset($data[\'exchange_rate\'])) {
            $updateFields[] = "exchange_rate = ?";
            $updateValues[] = (float)$data[\'exchange_rate\'];
        }

        if (isset($data[\'total_khr\'])) {
            $updateFields[] = "total_khr = ?";
            $updateValues[] = (float)$data[\'total_khr\'];
        }

        $1';

$newContent = preg_replace($pattern, $replacement, $content);

if ($newContent !== $content) {
    file_put_contents($filePath, $newContent);
    echo "✅ Successfully added exchange_rate handling to PUT method\n";
} else {
    echo "❌ Could not find the pattern to replace\n";
}
?>
