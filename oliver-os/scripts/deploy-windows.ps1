# Oliver-OS Windows Deployment Script
# For the honor, not the glory—by the people, for the people.

param(
    [string]$Environment = "development",
    [switch]$SkipDocker,
    [switch]$SkipFrontend,
    [switch]$SkipBackend,
    [switch]$SkipAIServices,
    [switch]$Help
)

if ($Help) {
    Write-Host "Oliver-OS Windows Deployment Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\scripts\deploy-windows.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Environment <env>    Set deployment environment (development|production) [default: development]" -ForegroundColor Gray
    Write-Host "  -SkipDocker          Skip Docker-based deployment" -ForegroundColor Gray
    Write-Host "  -SkipFrontend        Skip frontend deployment" -ForegroundColor Gray
    Write-Host "  -SkipBackend         Skip backend deployment" -ForegroundColor Gray
    Write-Host "  -SkipAIServices      Skip AI services deployment" -ForegroundColor Gray
    Write-Host "  -Help                Show this help message" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\scripts\deploy-windows.ps1                    # Development deployment" -ForegroundColor Gray
    Write-Host "  .\scripts\deploy-windows.ps1 -Environment production  # Production deployment" -ForegroundColor Gray
    Write-Host "  .\scripts\deploy-windows.ps1 -SkipDocker         # Skip Docker, use direct commands" -ForegroundColor Gray
    exit 0
}

Write-Host "🚀 Starting Oliver-OS Windows Deployment..." -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check prerequisites
Write-Status "Checking prerequisites..."

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Status "✅ Node.js version: $nodeVersion"
} catch {
    Write-Error "❌ Node.js not found. Please install Node.js 18+ first."
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Gray
    exit 1
}

# Check pnpm
try {
    $pnpmVersion = pnpm --version
    Write-Status "✅ pnpm version: $pnpmVersion"
} catch {
    Write-Warning "⚠️  pnpm not found. Installing pnpm..."
    npm install -g pnpm
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Failed to install pnpm. Please install manually: npm install -g pnpm"
        exit 1
    }
}

# Check Docker (if not skipping)
if (-not $SkipDocker) {
    try {
        docker --version | Out-Null
        Write-Status "✅ Docker is available"
    } catch {
        Write-Warning "⚠️  Docker not found. Will use direct deployment instead."
        $SkipDocker = $true
    }
}

# Set working directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot
Write-Status "Working directory: $(Get-Location)"

# Environment setup
if ($Environment -eq "production") {
    Write-Status "Setting up production environment..."
    
    if (-not (Test-Path ".env.production")) {
        Write-Warning ".env.production not found. Creating from example..."
        Copy-Item "env.production.example" ".env.production" -Force
        Write-Warning "Please edit .env.production with your production values before continuing."
        Write-Host "Press any key to continue after editing..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    
    # Load environment variables
    if (Test-Path ".env.production") {
        Get-Content ".env.production" | ForEach-Object {
            if ($_ -match "^([^#][^=]+)=(.*)$") {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    }
} else {
    Write-Status "Setting up development environment..."
    
    if (-not (Test-Path ".env")) {
        Write-Warning ".env not found. Creating from example..."
        Copy-Item "env.production.example" ".env" -Force
        Write-Warning "Please edit .env with your development values if needed."
    }
}

# Install dependencies
Write-Status "Installing backend dependencies..."
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Failed to install backend dependencies"
    exit 1
}

if (-not $SkipFrontend) {
    Write-Status "Installing frontend dependencies..."
    Push-Location "frontend"
    try {
        pnpm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "❌ Failed to install frontend dependencies"
            exit 1
        }
    } finally {
        Pop-Location
    }
}

# Database setup
Write-Status "Setting up database..."
try {
    pnpm db:generate
    pnpm db:push
    Write-Status "✅ Database setup complete"
} catch {
    Write-Warning "⚠️  Database setup failed, continuing..."
}

# Build applications
Write-Status "Building applications..."

if (-not $SkipBackend) {
    Write-Status "Building backend..."
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Backend build failed"
        exit 1
    }
}

if (-not $SkipFrontend) {
    Write-Status "Building frontend..."
    Push-Location "frontend"
    try {
        pnpm build
        if ($LASTEXITCODE -ne 0) {
            Write-Error "❌ Frontend build failed"
            exit 1
        }
    } finally {
        Pop-Location
    }
}

# Deployment strategy
if (-not $SkipDocker -and $Environment -eq "production") {
    Write-Status "Starting Docker-based production deployment..."
    
    # Check if Docker is running
    try {
        docker info | Out-Null
    } catch {
        Write-Error "❌ Docker is not running. Please start Docker Desktop and try again."
        exit 1
    }
    
    # Start Docker services
    Write-Status "Starting Docker services..."
    docker-compose -f docker/docker-compose.prod.yml --env-file .env.production up --build -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Docker deployment failed"
        exit 1
    }
    
    # Wait for services
    Write-Status "Waiting for services to be ready..."
    Start-Sleep -Seconds 30
    
    # Health checks
    Write-Status "Checking service health..."
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Status "✅ Backend is healthy"
        }
    } catch {
        Write-Warning "⚠️  Backend health check failed"
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Status "✅ AI services are healthy"
        }
    } catch {
        Write-Warning "⚠️  AI services health check failed (this might be expected if not configured)"
    }
    
} else {
    Write-Status "Starting direct deployment..."
    
    # Start services based on flags
    $processes = @()
    
    if (-not $SkipBackend) {
        Write-Status "Starting backend server..."
        $backendProcess = Start-Process -FilePath "node" -ArgumentList "dist/index.js" -PassThru -NoNewWindow
        $processes += $backendProcess
        Write-Status "✅ Backend started (PID: $($backendProcess.Id))"
    }
    
    if (-not $SkipAIServices) {
        Write-Status "Starting AI services..."
        Push-Location "ai-services"
        try {
            if (Test-Path "requirements.txt") {
                pip install -r requirements.txt
            }
            $aiProcess = Start-Process -FilePath "python" -ArgumentList "main.py" -PassThru -NoNewWindow
            $processes += $aiProcess
            Write-Status "✅ AI services started (PID: $($aiProcess.Id))"
        } finally {
            Pop-Location
        }
    }
    
    if (-not $SkipFrontend -and $Environment -eq "development") {
        Write-Status "Starting frontend development server..."
        Push-Location "frontend"
        try {
            $frontendProcess = Start-Process -FilePath "pnpm" -ArgumentList "dev" -PassThru -NoNewWindow
            $processes += $frontendProcess
            Write-Status "✅ Frontend started (PID: $($frontendProcess.Id))"
        } finally {
            Pop-Location
        }
    }
    
    Write-Status "🎉 Deployment completed successfully!"
    Write-Status "Services running:"
    foreach ($proc in $processes) {
        Write-Host "  - PID $($proc.Id): $($proc.ProcessName)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all services..." -ForegroundColor Yellow
    
    # Keep script running and handle cleanup
    try {
        while ($true) {
            Start-Sleep -Seconds 1
            # Check if processes are still running
            foreach ($proc in $processes) {
                if ($proc.HasExited) {
                    Write-Warning "Process $($proc.Id) has exited"
                }
            }
        }
    } catch {
        Write-Status "Shutting down services..."
        foreach ($proc in $processes) {
            if (-not $proc.HasExited) {
                $proc.Kill()
                Write-Status "Stopped process $($proc.Id)"
            }
        }
    }
}

Write-Status "🎉 Oliver-OS deployment completed!"
Write-Status "Available endpoints:"
Write-Host "  - Backend API: http://localhost:3000" -ForegroundColor Gray
Write-Host "  - Frontend: http://localhost:3000 (production) or http://localhost:5173 (development)" -ForegroundColor Gray
Write-Host "  - AI Services: http://localhost:8000" -ForegroundColor Gray
Write-Host "  - Health Check: http://localhost:3000/health" -ForegroundColor Gray

Write-Host ""
Write-Host "For the honor, not the glory—by the people, for the people. 🚀" -ForegroundColor Magenta
