@echo off
REM GTV Motor PHP Backend Deployment Script for Windows
REM This script helps deploy the PHP backend to Namecheap hosting

echo 🚀 GTV Motor PHP Backend Deployment Script
echo ==========================================

REM Check if required files exist
if not exist "database\schema.sql" (
    echo ❌ Error: database\schema.sql not found
    pause
    exit /b 1
)

if not exist "index.php" (
    echo ❌ Error: index.php not found
    pause
    exit /b 1
)

echo ✅ Required files found

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy env.example .env
    echo ⚠️  Please edit .env file with your database credentials before deployment
)

echo 🔧 Setting file permissions...
REM Note: Windows doesn't have chmod, but we can set basic permissions
attrib -R *.* /S
echo ✅ File permissions set

REM Create .htaccess for Apache
echo 📝 Creating .htaccess file...
(
echo RewriteEngine On
echo RewriteCond %%{REQUEST_FILENAME} !-f
echo RewriteCond %%{REQUEST_FILENAME} !-d
echo RewriteRule ^^(.*^)$ index.php [QSA,L]
echo.
echo # Security headers
echo Header always set X-Content-Type-Options nosniff
echo Header always set X-Frame-Options DENY
echo Header always set X-XSS-Protection "1; mode=block"
echo.
echo # CORS headers for API
echo Header always set Access-Control-Allow-Origin "*"
echo Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
echo Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
echo.
echo # Handle preflight requests
echo RewriteCond %%{REQUEST_METHOD} OPTIONS
echo RewriteRule ^^(.*^)$ $1 [R=200,L]
) > .htaccess

echo ✅ .htaccess file created

REM Create logs directory
if not exist "logs" mkdir logs
echo 📁 Logs directory created

echo.
echo 🎉 Deployment preparation complete!
echo.
echo Next steps:
echo 1. Upload all files to your Namecheap hosting
echo 2. Create MySQL database 'gtv_motor_php'
echo 3. Import database\schema.sql into your database
echo 4. Edit .env file with your database credentials
echo 5. Test the API endpoints
echo 6. Update frontend API client URL
echo.
echo API Base URL: https://your-domain.com/backend
echo Health Check: https://your-domain.com/backend/api/health
echo.
echo For detailed instructions, see README.md
pause
