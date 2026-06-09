@echo off
title LoginApp - Enterprise ERP System
echo ========================================================
echo Starting LoginApp (Day 5 Enterprise Edition)
echo ========================================================
echo.

echo [1/3] Installing Backend Dependencies...
cd backend
call npm install
cd ..

echo.
echo [2/3] Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo [3/3] Starting Servers...

:: Start the Backend server in a new window
start "LoginApp Backend Server" cmd /k "cd backend && title Backend && npm run dev"

:: Start the Frontend server in a new window
start "LoginApp Frontend Server" cmd /k "cd frontend && title Frontend && npm run dev"

echo.
echo ========================================================
echo DONE! Both servers are starting up in separate windows.
echo You can safely minimize this window.
echo ========================================================
pause
