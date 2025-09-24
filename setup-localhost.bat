@echo off
echo 🚀 GTV Motor Localhost Setup
echo ============================

echo.
echo Step 1: Checking if XAMPP is installed...
if exist "C:\xampp\htdocs" (
    echo ✅ XAMPP found
) else (
    echo ❌ XAMPP not found. Please install XAMPP first.
    echo Download from: https://www.apachefriends.org/
    pause
    exit /b 1
)

echo.
echo Step 2: Copying backend files...
if not exist "C:\xampp\htdocs\backend" mkdir "C:\xampp\htdocs\backend"
xcopy "backend\*" "C:\xampp\htdocs\backend\" /E /I /Y
echo ✅ Backend files copied

echo.
echo Step 3: Creating .env file...
(
echo DB_HOST=localhost
echo DB_NAME=gtv_motor_php
echo DB_USER=root
echo DB_PASSWORD=
echo DB_PORT=3306
echo JWT_SECRET=your-local-secret-key-123
echo APP_ENV=development
echo APP_DEBUG=true
) > "C:\xampp\htdocs\backend\.env"
echo ✅ .env file created

echo.
echo Step 4: Installing frontend dependencies...
call npm install
echo ✅ Dependencies installed

echo.
echo 🎉 Setup Complete!
echo.
echo Next steps:
echo 1. Start XAMPP (Apache + MySQL)
echo 2. Open http://localhost/phpmyadmin
echo 3. Create database: gtv_motor_php
echo 4. Import: backend\database\schema.sql
echo 5. Run: npm run dev
echo 6. Open: http://localhost:3000
echo.
echo Default login:
echo Email: admin@gtvmotor.com
echo Password: admin123
echo.
pause
