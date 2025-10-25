<?php
// Quick fix: Add exchange_rate and total_khr handling to PUT method
// This code should be inserted after line 462 in services.php

if (isset($data['exchange_rate'])) {
    $updateFields[] = "exchange_rate = ?";
    $updateValues[] = (float)$data['exchange_rate'];
}

if (isset($data['total_khr'])) {
    $updateFields[] = "total_khr = ?";
    $updateValues[] = (float)$data['total_khr'];
}
?>
