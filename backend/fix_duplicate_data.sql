-- Handle Duplicate Data Before Adding Constraints
-- This script identifies and resolves duplicate data issues

-- ==============================================
-- STEP 1: IDENTIFY DUPLICATE DATA
-- ==============================================

-- Check for duplicate plate numbers
SELECT
    'DUPLICATE_PLATE_NUMBERS' as issue_type,
    plate_number,
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(id ORDER BY id) as vehicle_ids,
    GROUP_CONCAT(customer_id ORDER BY id) as customer_ids
FROM vehicles
GROUP BY plate_number
HAVING COUNT(*) > 1;

-- Check for duplicate invoice numbers
SELECT
    'DUPLICATE_INVOICE_NUMBERS' as issue_type,
    invoice_number,
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(id ORDER BY id) as service_ids,
    GROUP_CONCAT(customer_id ORDER BY id) as customer_ids
FROM services
GROUP BY invoice_number
HAVING COUNT(*) > 1;

-- Check for duplicate customer phone numbers
SELECT
    'DUPLICATE_PHONE_NUMBERS' as issue_type,
    phone,
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(id ORDER BY id) as customer_ids,
    GROUP_CONCAT(name ORDER BY id) as customer_names
FROM customers
GROUP BY phone
HAVING COUNT(*) > 1;

-- Check for duplicate user emails
SELECT
    'DUPLICATE_USER_EMAILS' as issue_type,
    email,
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(id ORDER BY id) as user_ids,
    GROUP_CONCAT(username ORDER BY id) as usernames
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Check for duplicate usernames
SELECT
    'DUPLICATE_USERNAMES' as issue_type,
    username,
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(id ORDER BY id) as user_ids,
    GROUP_CONCAT(email ORDER BY id) as emails
FROM users
GROUP BY username
HAVING COUNT(*) > 1;

-- ==============================================
-- STEP 2: RESOLVE DUPLICATE PLATE NUMBERS
-- ==============================================

-- Strategy: Keep the first vehicle with each plate number, update others with unique suffixes
-- First, let's see what duplicates we have
SELECT
    plate_number,
    id,
    customer_id,
    vehicle_model_id,
    vin_number,
    year,
    created_at
FROM vehicles
WHERE plate_number IN (
    SELECT plate_number
    FROM vehicles
    GROUP BY plate_number
    HAVING COUNT(*) > 1
)
ORDER BY plate_number, id;

-- Update duplicate plate numbers with unique suffixes
-- Keep the first occurrence (lowest ID), update others
UPDATE vehicles v1
JOIN (
    SELECT
        plate_number,
        MIN(id) as keep_id,
        GROUP_CONCAT(id ORDER BY id) as all_ids
    FROM vehicles
    GROUP BY plate_number
    HAVING COUNT(*) > 1
) v2 ON v1.plate_number = v2.plate_number
SET v1.plate_number = CONCAT(v1.plate_number, '-DUP', v1.id)
WHERE v1.id != v2.keep_id;

-- ==============================================
-- STEP 3: RESOLVE DUPLICATE INVOICE NUMBERS
-- ==============================================

-- Check for duplicate invoice numbers
SELECT
    invoice_number,
    id,
    customer_id,
    service_date,
    total_amount,
    created_at
FROM services
WHERE invoice_number IN (
    SELECT invoice_number
    FROM services
    GROUP BY invoice_number
    HAVING COUNT(*) > 1
)
ORDER BY invoice_number, id;

-- Update duplicate invoice numbers with unique suffixes
UPDATE services s1
JOIN (
    SELECT
        invoice_number,
        MIN(id) as keep_id
    FROM services
    GROUP BY invoice_number
    HAVING COUNT(*) > 1
) s2 ON s1.invoice_number = s2.invoice_number
SET s1.invoice_number = CONCAT(s1.invoice_number, '-DUP', s1.id)
WHERE s1.id != s2.keep_id;

-- ==============================================
-- STEP 4: RESOLVE DUPLICATE CUSTOMER PHONE NUMBERS
-- ==============================================

-- Check for duplicate phone numbers
SELECT
    phone,
    id,
    name,
    email,
    created_at
FROM customers
WHERE phone IN (
    SELECT phone
    FROM customers
    GROUP BY phone
    HAVING COUNT(*) > 1
)
ORDER BY phone, id;

-- Update duplicate phone numbers with unique suffixes
UPDATE customers c1
JOIN (
    SELECT
        phone,
        MIN(id) as keep_id
    FROM customers
    GROUP BY phone
    HAVING COUNT(*) > 1
) c2 ON c1.phone = c2.phone
SET c1.phone = CONCAT(c1.phone, '-DUP', c1.id)
WHERE c1.id != c2.keep_id;

-- ==============================================
-- STEP 5: RESOLVE DUPLICATE USER EMAILS
-- ==============================================

-- Check for duplicate emails
SELECT
    email,
    id,
    username,
    full_name,
    created_at
FROM users
WHERE email IN (
    SELECT email
    FROM users
    GROUP BY email
    HAVING COUNT(*) > 1
)
ORDER BY email, id;

-- Update duplicate emails with unique suffixes
UPDATE users u1
JOIN (
    SELECT
        email,
        MIN(id) as keep_id
    FROM users
    GROUP BY email
    HAVING COUNT(*) > 1
) u2 ON u1.email = u2.email
SET u1.email = CONCAT(SUBSTRING_INDEX(u1.email, '@', 1), '-DUP', u1.id, '@', SUBSTRING_INDEX(u1.email, '@', -1))
WHERE u1.id != u2.keep_id;

-- ==============================================
-- STEP 6: RESOLVE DUPLICATE USERNAMES
-- ==============================================

-- Check for duplicate usernames
SELECT
    username,
    id,
    email,
    full_name,
    created_at
FROM users
WHERE username IN (
    SELECT username
    FROM users
    GROUP BY username
    HAVING COUNT(*) > 1
)
ORDER BY username, id;

-- Update duplicate usernames with unique suffixes
UPDATE users u1
JOIN (
    SELECT
        username,
        MIN(id) as keep_id
    FROM users
    GROUP BY username
    HAVING COUNT(*) > 1
) u2 ON u1.username = u2.username
SET u1.username = CONCAT(u1.username, '-DUP', u1.id)
WHERE u1.id != u2.keep_id;

-- ==============================================
-- STEP 7: VERIFY DUPLICATES ARE RESOLVED
-- ==============================================

-- Re-check for any remaining duplicates
SELECT 'REMAINING_DUPLICATE_PLATE_NUMBERS' as check_type, COUNT(*) as count
FROM (
    SELECT plate_number
    FROM vehicles
    GROUP BY plate_number
    HAVING COUNT(*) > 1
) as duplicates

UNION ALL

SELECT 'REMAINING_DUPLICATE_INVOICE_NUMBERS' as check_type, COUNT(*) as count
FROM (
    SELECT invoice_number
    FROM services
    GROUP BY invoice_number
    HAVING COUNT(*) > 1
) as duplicates

UNION ALL

SELECT 'REMAINING_DUPLICATE_PHONE_NUMBERS' as check_type, COUNT(*) as count
FROM (
    SELECT phone
    FROM customers
    GROUP BY phone
    HAVING COUNT(*) > 1
) as duplicates

UNION ALL

SELECT 'REMAINING_DUPLICATE_USER_EMAILS' as check_type, COUNT(*) as count
FROM (
    SELECT email
    FROM users
    GROUP BY email
    HAVING COUNT(*) > 1
) as duplicates

UNION ALL

SELECT 'REMAINING_DUPLICATE_USERNAMES' as check_type, COUNT(*) as count
FROM (
    SELECT username
    FROM users
    GROUP BY username
    HAVING COUNT(*) > 1
) as duplicates;

-- ==============================================
-- STEP 8: SHOW SUMMARY OF CHANGES
-- ==============================================

-- Show updated plate numbers
SELECT
    'UPDATED_PLATE_NUMBERS' as change_type,
    id,
    plate_number,
    customer_id,
    'Updated to resolve duplicate' as reason
FROM vehicles
WHERE plate_number LIKE '%-DUP%'

UNION ALL

-- Show updated invoice numbers
SELECT
    'UPDATED_INVOICE_NUMBERS' as change_type,
    id,
    invoice_number,
    customer_id,
    'Updated to resolve duplicate' as reason
FROM services
WHERE invoice_number LIKE '%-DUP%'

UNION ALL

-- Show updated phone numbers
SELECT
    'UPDATED_PHONE_NUMBERS' as change_type,
    id,
    phone,
    id as customer_id,
    'Updated to resolve duplicate' as reason
FROM customers
WHERE phone LIKE '%-DUP%'

UNION ALL

-- Show updated emails
SELECT
    'UPDATED_EMAILS' as change_type,
    id,
    email,
    id as customer_id,
    'Updated to resolve duplicate' as reason
FROM users
WHERE email LIKE '%-DUP%'

UNION ALL

-- Show updated usernames
SELECT
    'UPDATED_USERNAMES' as change_type,
    id,
    username,
    id as customer_id,
    'Updated to resolve duplicate' as reason
FROM users
WHERE username LIKE '%-DUP%';

-- ==============================================
-- STEP 9: FINAL DATA SUMMARY
-- ==============================================

-- Show final counts
SELECT 'CUSTOMERS' as table_name, COUNT(*) as record_count FROM customers
UNION ALL
SELECT 'VEHICLES' as table_name, COUNT(*) as record_count FROM vehicles
UNION ALL
SELECT 'SERVICES' as table_name, COUNT(*) as record_count FROM services
UNION ALL
SELECT 'USERS' as table_name, COUNT(*) as record_count FROM users;

COMMIT;
