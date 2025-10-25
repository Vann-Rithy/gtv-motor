# Exchange Rate Fix for services.php

## Problem
The PUT method in backend/api/services.php doesn't handle exchange_rate and total_khr updates.

## Solution
Add the following code after line 462 in backend/api/services.php:

```php
        if (isset($data['exchange_rate'])) {
            $updateFields[] = "exchange_rate = ?";
            $updateValues[] = (float)$data['exchange_rate'];
        }

        if (isset($data['total_khr'])) {
            $updateFields[] = "total_khr = ?";
            $updateValues[] = (float)$data['total_khr'];
        }
```

## Location
Insert this code right after line 462 (after the sales_rep_id handling) and before line 464 (the timestamp update).

## Current Code Structure
```php
        if (isset($data['sales_rep_id'])) {
            $updateFields[] = "sales_rep_id = ?";
            $updateValues[] = isset($data['sales_rep_id']) ? (int)$data['sales_rep_id'] : null;
        }

        // INSERT EXCHANGE RATE CODE HERE

        // Always update the updated_at timestamp
        $updateFields[] = "updated_at = NOW()";
```

## Test
After applying this fix, test by:
1. Creating a service (exchange_rate = 0)
2. Opening invoice modal
3. Entering exchange rate (e.g., 4565)
4. Clicking "Generate Invoice"
5. Check database - exchange_rate should be updated
