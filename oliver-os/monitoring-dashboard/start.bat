@echo off
echo 🚀 Starting Smart Assistance Monitoring Dashboard...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ pnpm is not installed. Installing pnpm...
    npm install -g pnpm
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    pnpm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
)

REM Check if Smart Assistance System is running
echo 🔍 Checking Smart Assistance System connection...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Smart Assistance System is running on port 3000
) else (
    echo ⚠️  Smart Assistance System is not running on port 3000
    echo    The dashboard will start but may not have real-time data
)

REM Start the development server
echo.
echo 🎯 Starting monitoring dashboard on port 3001...
echo    Dashboard URL: http://localhost:3001
echo    Press Ctrl+C to stop the dashboard
echo.

pnpm dev
