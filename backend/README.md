# GTV Motor PHP Backend

This is the PHP backend for the GTV Motor aftersales management system, designed to work with the Next.js frontend hosted on Vercel.

## Features

- **Authentication System**: User login, registration, and session management
- **Customer Management**: Complete customer database with contact information
- **Vehicle Management**: Vehicle tracking with warranty information
- **Service Management**: Service records, invoicing, and tracking
- **Inventory Management**: Parts and supplies tracking with stock alerts
- **Booking System**: Appointment scheduling and management
- **Warranty Management**: Warranty tracking and claims processing
- **Reporting**: Comprehensive reports and analytics
- **Dashboard**: Real-time statistics and insights
- **Alerts & Notifications**: Service reminders and system alerts

## Database Schema

The system uses MySQL/MariaDB with the following main tables:
- `users` - System users and authentication
- `customers` - Customer information
- `vehicles` - Vehicle records linked to customers
- `services` - Service records and invoices
- `service_types` - Available service types
- `inventory_items` - Parts and supplies inventory
- `bookings` - Appointment scheduling
- `warranties` - Warranty information
- `service_alerts` - Automated alerts and reminders
- `staff` - Staff member information

## Installation

### Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or MariaDB 10.3 or higher
- Web server (Apache/Nginx)
- Composer (for dependency management)

### Setup Instructions

1. **Upload Files**
   ```bash
   # Upload the backend folder to your Namecheap hosting
   # Ensure the backend folder is accessible via web
   ```

2. **Database Setup**
   ```sql
   -- Create the database
   CREATE DATABASE gtv_motor_php CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   -- Import the schema
   mysql -u username -p gtv_motor_php < database/schema.sql
   ```

3. **Environment Configuration**
   ```bash
   # Copy the environment template
   cp env.example .env
   
   # Edit .env with your database credentials
   DB_HOST=localhost
   DB_NAME=gtv_motor_php
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_PORT=3306
   
   # Set your JWT secret
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

4. **File Permissions**
   ```bash
   # Set appropriate permissions
   chmod 755 backend/
   chmod 644 backend/*.php
   chmod 644 backend/api/*.php
   chmod 644 backend/config/*.php
   chmod 644 backend/includes/*.php
   ```

5. **Web Server Configuration**
   
   **Apache (.htaccess)**
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ index.php [QSA,L]
   ```

   **Nginx**
   ```nginx
   location / {
       try_files $uri $uri/ /index.php?$query_string;
   }
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Core Resources
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/vehicles` - List vehicles
- `POST /api/vehicles` - Create vehicle
- `GET /api/services` - List services
- `POST /api/services` - Create service
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking

### Inventory
- `GET /api/inventory` - List inventory items
- `POST /api/inventory` - Create inventory item

### Reports
- `GET /api/reports/summary` - Summary report
- `GET /api/reports/customer` - Customer report
- `GET /api/reports/warranty` - Warranty report

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/analytics` - Analytics data

### System
- `GET /api/health` - Health check
- `GET /api/settings` - Get settings
- `POST /api/settings` - Update settings

## Frontend Integration

Update your frontend API client to point to the PHP backend:

```typescript
// lib/api-client.ts
const apiClient = new ApiClient("https://your-domain.com/backend")
```

## Security Features

- **Password Hashing**: Uses PHP's `password_hash()` with bcrypt
- **SQL Injection Protection**: All queries use prepared statements
- **XSS Protection**: Input sanitization and output escaping
- **CSRF Protection**: Session-based CSRF tokens
- **Rate Limiting**: Login attempt tracking
- **Input Validation**: Comprehensive data validation

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00Z",
  "details": {}
}
```

## Logging

- Application logs are written to PHP error log
- Database errors are logged with context
- API errors include request details

## Performance

- **Database Connection Pooling**: Efficient connection management
- **Query Optimization**: Indexed database queries
- **Response Caching**: Appropriate HTTP caching headers
- **Input Validation**: Early validation to prevent unnecessary processing

## Deployment Checklist

- [ ] Upload backend files to Namecheap hosting
- [ ] Create MySQL database `gtv_motor_php`
- [ ] Import database schema
- [ ] Configure environment variables
- [ ] Set file permissions
- [ ] Configure web server (Apache/Nginx)
- [ ] Test API endpoints
- [ ] Update frontend API client URL
- [ ] Test frontend-backend integration

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials in `.env`
   - Verify database server is running
   - Ensure database exists

2. **Permission Denied**
   - Check file permissions (755 for directories, 644 for files)
   - Verify web server user has access

3. **API Not Found (404)**
   - Check web server rewrite rules
   - Verify `index.php` is accessible
   - Check URL routing

4. **CORS Issues**
   - Verify CORS headers in `config/config.php`
   - Check frontend domain configuration

### Debug Mode

Enable debug mode in `.env`:
```
APP_ENV=development
APP_DEBUG=true
```

## Support

For technical support or questions about the GTV Motor PHP backend, please contact the development team.

## License

This project is proprietary software for GTV Motor. All rights reserved.
