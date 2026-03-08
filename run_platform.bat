@echo off
setlocal
echo ========================================
echo   Starting College Quiz Platform
echo ========================================

:: Check Client Dependencies
if not exist "%~dp0client\node_modules" (
    echo [1/3] Installing Frontend Dependencies...
    cd /d "%~dp0client" && npm install
)

:: Check Server Dependencies
if not exist "%~dp0server\node_modules" (
    echo [2/3] Installing Backend Dependencies...
    cd /d "%~dp0server" && npm install
)

echo [3/3] Launching Servers...

:: Start Backend
start "Quiz Backend" /D "%~dp0server" cmd /k npm start

:: Start Frontend
start "Quiz Frontend" /D "%~dp0client" cmd /k npm run dev

echo.
echo Platform is launching! 
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173 (usually)
echo.
echo If "Address already in use" error occurs, close existing terminal windows or restart computer.
pause
