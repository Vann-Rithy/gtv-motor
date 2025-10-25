<?php
// Manual fix for exchange_rate in services.php
// This script will insert the exchange_rate handling code

$filePath = 'api/services.php';
$lines = file($filePath);

// Find the line with sales_rep_id closing brace
$insertAfterLine = -1;
for ($i = 0; $i < count($lines); $i++) {
    if (strpos($lines[$i], "sales_rep_id'] : null;") !== false) {
        $insertAfterLine = $i;
        break;
    }
}

if ($insertAfterLine !== -1) {
    // Insert the exchange_rate handling code
    $newLines = array_slice($lines, 0, $insertAfterLine + 1);
    $newLines[] = "\n";
    $newLines[] = "        if (isset(\$data['exchange_rate'])) {\n";
    $newLines[] = "            \$updateFields[] = \"exchange_rate = ?\";\n";
    $newLines[] = "            \$updateValues[] = (float)\$data['exchange_rate'];\n";
    $newLines[] = "        }\n";
    $newLines[] = "\n";
    $newLines[] = "        if (isset(\$data['total_khr'])) {\n";
    $newLines[] = "            \$updateFields[] = \"total_khr = ?\";\n";
    $newLines[] = "            \$updateValues[] = (float)\$data['total_khr'];\n";
    $newLines[] = "        }\n";
    $newLines[] = "\n";
    
    // Add the rest of the lines
    $newLines = array_merge($newLines, array_slice($lines, $insertAfterLine + 1));
    
    file_put_contents($filePath, implode('', $newLines));
    echo "✅ Successfully added exchange_rate handling to services.php\n";
} else {
    echo "❌ Could not find the insertion point\n";
}
?>
