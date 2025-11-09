# GTV Motor API v1 Setup Guide

## Overview

This guide will help you set up the GTV Motor API v1 for deployment to `api.gtvmotor.dev/v1/`.

## File Structure

```
backend/api/v1/
├── config.php              # API configuration (DO NOT COMMIT)
├── config.example.php      # Configuration template
├── index.php               # Main router
├── customers.php           # Customers endpoint
├── vehicles.php            # Vehicles endpoint
├── invoices.php            # Service invoices endpoint
├── middleware/
│   └── ApiAuth.php         # API key authentication
├── .htaccess               # Apache routing configuration
├── README.md               # API documentation
└── SETUP.md                # This file
```

## Setup Steps

### 1. Configure API Keys

1. Copy the example configuration:
   ```bash
   cp backend/api/v1/config.example.php backend/api/v1/config.php
   ```

2. Edit `backend/api/v1/config.php` and add your API keys:
   ```php
   define('API_V1_KEYS', [
       'your_secure_api_key_here' => [
           'name' => 'Production API Key',
           'permissions' => ['read', 'write'],
           'rate_limit' => 1000,
           'active' => true
       ],
   ]);
   ```

3. Generate a secure API key:
   ```php
   <?php
   // Generate API key
   echo hash('sha256', 'gtvmotor_secret_' . date('Y'));
   ?>
   ```

### 2. Server Configuration

#### Apache Configuration

Ensure mod_rewrite is enabled:
```apache
LoadModule rewrite_module modules/mod_rewrite.so
```

The `.htaccess` file is already configured for routing.

#### Nginx Configuration

If using Nginx, add this configuration:
```nginx
location /v1/ {
    try_files $uri $uri/ /v1/index.php?$query_string;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 3. Database Configuration

Ensure your database connection is configured in:
- `backend/config/database.php`
- Or via environment variables in `.env`

### 4. Directory Permissions

Set proper permissions for log directory:
```bash
mkdir -p backend/logs
chmod 755 backend/logs
chmod 644 backend/api/v1/config.php
```

### 5. Security Checklist

- [ ] API keys are stored securely (not in version control)
- [ ] HTTPS is enabled in production
- [ ] Rate limiting is configured
- [ ] Log directory is writable
- [ ] `.htaccess` is configured correctly
- [ ] CORS origins are restricted
- [ ] Error reporting is disabled in production

### 6. Testing

Test the API endpoints:

```bash
# Test API info endpoint
curl https://api.gtvmotor.dev/v1/

# Test customers endpoint (with API key)
curl -H "X-API-Key: your_api_key" https://api.gtvmotor.dev/v1/customers

# Test specific customer
curl -H "X-API-Key: your_api_key" https://api.gtvmotor.dev/v1/customers/1
```

## Deployment to api.gtvmotor.dev

### Upload Files

Upload the following to your server:
```
backend/api/v1/          → /path/to/api.gtvmotor.dev/v1/
```

### Server Path Structure

```
/path/to/api.gtvmotor.dev/
├── v1/
│   ├── config.php
│   ├── index.php
│   ├── customers.php
│   ├── vehicles.php
│   ├── invoices.php
│   ├── middleware/
│   └── .htaccess
```

### Environment Setup

1. Ensure PHP 7.4+ is installed
2. Enable required PHP extensions:
   - PDO
   - PDO_MySQL
   - JSON
   - mbstring

3. Configure database connection in `backend/config/database.php`

## API Key Management

### Creating API Keys

1. Generate a secure key:
   ```php
   <?php
   $apiKey = hash('sha256', 'your_secret_' . time());
   echo $apiKey;
   ?>
   ```

2. Add to `config.php`:
   ```php
   'generated_key_here' => [
       'name' => 'Client API Key',
       'permissions' => ['read'],
       'rate_limit' => 100,
       'active' => true
   ]
   ```

### Revoking API Keys

Set `'active' => false` in the API key configuration.

### Rotating API Keys

1. Generate new key
2. Update `config.php` with new key
3. Notify clients to update their API key
4. Deactivate old key after transition period

## Monitoring

### Logs

API requests are logged to:
```
backend/logs/api_v1.log
```

Rate limiting data is stored in:
```
backend/logs/rate_limit_[key_hash].json
```

### Monitoring Checklist

- [ ] Monitor API usage logs
- [ ] Check rate limit violations
- [ ] Monitor error rates
- [ ] Track response times
- [ ] Review security logs

## Troubleshooting

### Common Issues

1. **404 Not Found**
   - Check `.htaccess` is working
   - Verify mod_rewrite is enabled
   - Check file paths

2. **401 Unauthorized**
   - Verify API key is correct
   - Check API key is active
   - Ensure header format is correct

3. **429 Too Many Requests**
   - Rate limit exceeded
   - Wait or increase rate limit

4. **500 Internal Server Error**
   - Check PHP error logs
   - Verify database connection
   - Check file permissions

### Debug Mode

Enable debug mode in `config.php`:
```php
define('API_V1_DEBUG', true);
```

## Support

For issues or questions:
- Email: api@gtvmotor.dev
- Documentation: https://api.gtvmotor.dev/v1/README.md

