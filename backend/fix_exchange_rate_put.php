<?php
// Script to fix exchange_rate handling in services.php PUT method

$filePath = 'api/services.php';
$content = file_get_contents($filePath);

// Find the line with sales_rep_id handling in PUT method
$pattern = '/(if \(isset\(\$data\[\'sales_rep_id\'\]\) \{[^}]+\}\s*)(\/\/ Always update the updated_at timestamp)/s';

$replacement = '$1
        if (isset($data[\'exchange_rate\'])) {
            $updateFields[] = "exchange_rate = ?";
            $updateValues[] = (float)$data[\'exchange_rate\'];
        }

        if (isset($data[\'total_khr\'])) {
            $updateFields[] = "total_khr = ?";
            $updateValues[] = (float)$data[\'total_khr\'];
        }

        $2';

$newContent = preg_replace($pattern, $replacement, $content);

if ($newContent !== $content) {
    file_put_contents($filePath, $newContent);
    echo "✅ Fixed exchange_rate handling in services.php PUT method\n";
} else {
    echo "❌ Could not find the pattern to replace\n";
}
?>
