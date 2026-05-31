@echo off
echo Starting Siembre High School Kiosk System...
echo.

echo 1. Starting MongoDB...
net start MongoDB 2>nul
if %errorlevel% neq 0 (
    echo MongoDB is already running or starting...
)

echo.
echo 2. Starting Backend Server...
cd backend
start cmd /k "npm run dev"

echo.
echo 3. Opening Frontend...
timeout /t 3
start http://127.0.0.1:5500/kiosora/front-end/html/intro.html

echo.
echo ========================================
echo ✅ System Started!
echo 📁 Backend: http://localhost:5000
echo 📁 Frontend: http://127.0.0.1:5500/kiosora/front-end/html/intro.html
echo ========================================