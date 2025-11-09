# API v1 Troubleshooting Guide

## HTTP 500 Error

If you're getting a 500 error, follow these steps:

### Step 1: Check Debug Script

1. Upload `debug.php` to your server at `/api/v1/debug.php`
2. Visit: `https://api.gtvmotor.dev/api/v1/debug.php`
3. Check what files are missing or have errors

### Step 2: Common Issues

#### Issue 1: Missing Files
**Error:** "Configuration file not found"

**Solution:**
- Make sure all files are uploaded to the correct location:
  ```
  /api/v1/
  ├── index.php
  ├── config.php
  ├── customers.php
  ├── vehicles.php
  ├── invoices.php
  ├── analytics.php
  └── middleware/
      └── ApiAuth.php
  ```

- Make sure parent directories exist:
  ```
  /config/
  ├── config.php
  └── database.php

  /includes/
  └── Response.php
  ```

#### Issue 2: Path Issues
**Error:** "File not found" or path errors

**Solution:**
- Check the file structure matches what's expected
- The paths in `index.php` use `__DIR__` which should work, but verify:
  - `__DIR__ . '/../config/config.php'` should point to `/config/config.php`
  - `__DIR__ . '/../includes/Response.php'` should point to `/includes/Response.php`

#### Issue 3: PHP Errors
**Error:** PHP syntax errors or undefined constants

**Solution:**
1. Check PHP error logs on your server
2. Enable error reporting temporarily:
   ```php
   error_reporting(E_ALL);
   ini_set('display_errors', 1);
   ```
3. Check for syntax errors in all PHP files

#### Issue 4: Missing Constants
**Error:** "Undefined constant API_V1_VERSION"

**Solution:**
- Make sure `config.php` exists in `/api/v1/` directory
- Check that all `define()` statements are present

### Step 3: Test Individual Components

1. **Test config.php:**
   ```php
   <?php
   require_once __DIR__ . '/config.php';
   echo API_V1_VERSION;
   ?>
   ```

2. **Test Response class:**
   ```php
   <?php
   require_once __DIR__ . '/../includes/Response.php';
   Response::success(['test' => 'data'], 'Test');
   ?>
   ```

3. **Test database connection:**
   ```php
   <?php
   require_once __DIR__ . '/../config/database.php';
   $db = new Database();
   $conn = $db->getConnection();
   echo "Connected!";
   ?>
   ```

### Step 4: Check Server Configuration

#### Apache
- Make sure `mod_rewrite` is enabled
- Check `.htaccess` file is present and readable
- Verify `AllowOverride All` is set in Apache config

#### PHP
- Check PHP version (should be 7.4+)
- Verify required PHP extensions are installed:
  - PDO
  - PDO_MySQL
  - JSON

### Step 5: Check File Permissions

Make sure files are readable:
```bash
chmod 644 *.php
chmod 755 middleware/
```

### Step 6: Check Error Logs

Check your server's error logs:
- Apache: `/var/log/apache2/error.log`
- cPanel: Check error logs in File Manager
- PHP: Check `php_error.log`

### Quick Fix Checklist

- [ ] All files uploaded to correct locations
- [ ] `config.php` exists in `/api/v1/`
- [ ] Parent directories (`/config/`, `/includes/`) exist
- [ ] File permissions are correct
- [ ] PHP version is 7.4 or higher
- [ ] Required PHP extensions installed
- [ ] `.htaccess` file is present
- [ ] `mod_rewrite` is enabled (Apache)
- [ ] Error logs checked

### Still Not Working?

1. Run `debug.php` and share the output
2. Check server error logs
3. Verify file paths match your server structure
4. Test with a simple `index.php` that just echoes "Hello World"

