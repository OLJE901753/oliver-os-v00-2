@echo off
REM Oliver-OS Simple Windows Deployment
REM For the honor, not the glory—by the people, for the people.

echo 🚀 Oliver-OS Simple Windows Deployment
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this from the oliver-os directory.
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 18+ first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check pnpm
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing pnpm...
    npm install -g pnpm
    if errorlevel 1 (
        echo ❌ Failed to install pnpm
        pause
        exit /b 1
    )
)

echo ✅ Prerequisites check passed
echo.

REM Install backend dependencies
echo 📦 Installing backend dependencies...
call pnpm install
if errorlevel 1 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
call pnpm install
if errorlevel 1 (
    echo ❌ Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

REM Setup environment
if not exist ".env" (
    echo ⚠️  Creating .env file from example...
    copy "env.production.example" ".env" >nul
    echo ⚠️  Please edit .env with your values if needed.
)

REM Database setup
echo 🗄️  Setting up database...
call pnpm db:generate
call pnpm db:push

echo.
echo 🎉 Setup complete! Choose deployment option:
echo.
echo 1. Development mode (backend + frontend dev servers)
echo 2. Production mode (built applications)
echo 3. Docker production mode
echo 4. Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto prod
if "%choice%"=="3" goto docker
if "%choice%"=="4" goto end
goto invalid

:dev
echo 🚀 Starting development mode...
echo Starting backend...
start "Oliver-OS Backend" cmd /k "pnpm dev"
timeout /t 3 /nobreak >nul
echo Starting frontend...
cd frontend
start "Oliver-OS Frontend" cmd /k "pnpm dev"
cd ..
echo ✅ Development servers started!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
goto end

:prod
echo 🚀 Starting production mode...
echo Building backend...
call pnpm build
if errorlevel 1 (
    echo ❌ Backend build failed
    pause
    exit /b 1
)
echo Building frontend...
cd frontend
call pnpm build
if errorlevel 1 (
    echo ❌ Frontend build failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo Starting backend...
start "Oliver-OS Backend" cmd /k "pnpm start"
timeout /t 3 /nobreak >nul
echo Starting frontend preview...
cd frontend
start "Oliver-OS Frontend" cmd /k "pnpm preview"
cd ..
echo ✅ Production servers started!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:4173
goto end

:docker
echo 🐳 Starting Docker production mode...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker not found. Please install Docker Desktop first.
    pause
    exit /b 1
)

if not exist ".env.production" (
    echo ⚠️  Creating .env.production from example...
    copy "env.production.example" ".env.production" >nul
    echo ⚠️  Please edit .env.production with your production values!
    pause
)

echo Starting Docker services...
docker-compose -f docker/docker-compose.prod.yml --env-file .env.production up --build -d
if errorlevel 1 (
    echo ❌ Docker deployment failed
    pause
    exit /b 1
)

echo ✅ Docker services started!
echo Backend: http://localhost:3000
echo AI Services: http://localhost:8000
echo Grafana: http://localhost:3001
goto end

:invalid
echo ❌ Invalid choice. Please run the script again.
pause
exit /b 1

:end
echo.
echo 🎉 Oliver-OS deployment complete!
echo For the honor, not the glory—by the people, for the people. 🚀
pause
