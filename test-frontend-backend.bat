@echo off
echo 🧪 Testing Frontend-Backend Integration
echo ======================================

echo.
echo Step 1: Testing Backend Health...
curl -s http://localhost/backend/api/health
echo.

echo.
echo Step 2: Testing Backend Login...
curl -s -X POST http://localhost/backend/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@gtvmotor.com\",\"password\":\"admin123\"}"
echo.

echo.
echo Step 3: Testing Backend Service Types...
curl -s http://localhost/backend/api/service-types
echo.

echo.
echo ✅ Backend tests complete!
echo.
echo If you see JSON responses above, your backend is working.
echo Now you can start the frontend with: npm run dev
echo.
echo Frontend will be available at: http://localhost:3000
echo Backend API is at: http://localhost/backend
echo.
pause
