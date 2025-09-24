@echo off
echo 🧪 Testing GTV Motor Backend
echo ============================

echo.
echo Testing backend endpoints...

echo.
echo 1. Health Check...
curl -s http://localhost/backend/api/health
echo.

echo.
echo 2. Service Types...
curl -s http://localhost/backend/api/service-types
echo.

echo.
echo 3. Login Test...
curl -s -X POST http://localhost/backend/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@gtvmotor.com\",\"password\":\"admin123\"}"
echo.

echo.
echo ✅ Backend test complete!
echo.
echo If you see JSON responses above, your backend is working!
echo If you see errors, check:
echo - XAMPP is running (Apache + MySQL)
echo - Database 'gtv_motor_php' exists
echo - Schema is imported
echo - .env file is configured
echo.
pause
