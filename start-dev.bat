@echo off
:: Change working directory to the directory where this batch file is located
cd /d "%~dp0"

title Library Management System - Development Server
echo ========================================================
echo   Starting Library Management System Development Server
echo ========================================================
echo.

npm.cmd run dev

:: If server stops or fails, keep the window open to view log output
pause
