<?php
// Script to add exchange_rate handling to PUT method in services.php

$filePath = 'api/services.php';
$content = file_get_contents($filePath);

// Find the PUT method section and add exchange_rate handling
$pattern = '/(if \(isset\(\$data\[\'sales_rep_id\'\]\) \{[^}]+\}\s*)(\/\/ Always update the updated_at timestamp\s*\$updateFields\[\] = "updated_at = NOW\(\)";\s*if \(empty\(\$updateFields\)\) \{\s*Response::error\(\'No fields to update\', 400\);\s*\})/s';

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
    echo "✅ Successfully added exchange_rate handling to PUT method\n";
} else {
    echo "❌ Could not find the pattern to replace\n";
    echo "Let me try a different approach...\n";
    
    // Try a simpler pattern
    $pattern2 = '/(if \(isset\(\$data\[\'sales_rep_id\'\]\) \{[^}]+\}\s*)(\/\/ Always update the updated_at timestamp)/s';
    $replacement2 = '$1
        if (isset($data[\'exchange_rate\'])) {
            $updateFields[] = "exchange_rate = ?";
            $updateValues[] = (float)$data[\'exchange_rate\'];
        }

        if (isset($data[\'total_khr\'])) {
            $updateFields[] = "total_khr = ?";
            $updateValues[] = (float)$data[\'total_khr\'];
        }

        $2';
    
    $newContent2 = preg_replace($pattern2, $replacement2, $content);
    
    if ($newContent2 !== $content) {
        file_put_contents($filePath, $newContent2);
        echo "✅ Successfully added exchange_rate handling to PUT method (second attempt)\n";
    } else {
        echo "❌ Still could not find the pattern. Manual fix required.\n";
    }
}
?>
