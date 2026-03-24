@echo off
REM =============================================================================
REM Room Service — Dev Runner (Windows)
REM Starts both client and server with SQLite (no Docker needed).
REM
REM Requirements:
REM   - Node.js 18+ installed
REM   - npm install run in both /client and /server
REM =============================================================================

echo ========================================
echo  Room Service — Development Mode (SQLite)
echo ========================================
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

REM Install dependencies if node_modules missing
if not exist "server\node_modules" (
    echo [server] Installing dependencies...
    cd /d server
    call npm install
    cd /d ..
)

if not exist "client\node_modules" (
    echo [client] Installing dependencies...
    cd /d client
    call npm install
    cd /d ..
)

echo.
echo Starting server (SQLite) on http://localhost:3001 ...
start "RoomService-Server" cmd /c "cd server ^&^& npm run dev"

timeout /t 3 >nul

echo.
echo Starting client (Vite) on http://localhost:5173 ...
start "RoomService-Client" cmd /c "cd client ^&^& npm run dev"

echo.
echo ========================================
echo  Server:  http://localhost:3001
echo  Client:  http://localhost:5173
echo  Admin:   http://localhost:5173/admin
echo.
echo  Press any key to open in browser...
pause >nul

start http://localhost:5173
echo.
echo Done. Close the terminal windows to stop services.
