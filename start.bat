@echo off
echo Starting Sortyx Smart Bin Application...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak > nul

echo Starting Frontend...
start "Frontend" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3001
echo Frontend: Check the Frontend terminal for the URL
echo Default Login: admin@sortyx.com / admin123
echo.
pause