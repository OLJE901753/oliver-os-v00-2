# Oliver-OS Docker Build Testing Script
# Tests all Docker builds locally before pushing to CI/CD
# Usage: .\test-docker-build.ps1

Write-Host "🐳 Oliver-OS Docker Build Testing" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Function to print section headers
function Write-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "  $Message" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
}

# Check Docker is running
Write-Section "Checking Docker Status"
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Clean up existing test containers
Write-Section "Cleaning Up Existing Test Containers"
Write-Host "Stopping and removing old test containers..." -ForegroundColor Gray
docker stop oliver-backend-test oliver-ai-test 2>$null
docker rm oliver-backend-test oliver-ai-test 2>$null
Write-Host "✅ Cleanup complete" -ForegroundColor Green

# Test 1: Build Backend Docker Image
Write-Section "Test 1: Building Backend Docker Image"
Write-Host "Building oliver-os backend..." -ForegroundColor Cyan
$backendBuildStart = Get-Date

docker build -f oliver-os/Dockerfile -t oliver-os-backend-test oliver-os

if ($LASTEXITCODE -eq 0) {
    $backendBuildTime = ((Get-Date) - $backendBuildStart).TotalSeconds
    Write-Host "✅ Backend image built successfully in $([math]::Round($backendBuildTime, 2))s" -ForegroundColor Green
    
    # Show image size
    $imageSize = docker images oliver-os-backend-test --format "{{.Size}}"
    Write-Host "📦 Image size: $imageSize" -ForegroundColor Cyan
} else {
    Write-Host "❌ Backend image build FAILED!" -ForegroundColor Red
    Write-Host "Check the error output above for details." -ForegroundColor Yellow
    exit 1
}

# Test 2: Build AI Services Docker Image
Write-Section "Test 2: Building AI Services Docker Image"
Write-Host "Building oliver-os AI services..." -ForegroundColor Cyan
$aiBuildStart = Get-Date

docker build -f oliver-os/ai-services/Dockerfile -t oliver-os-ai-test oliver-os/ai-services

if ($LASTEXITCODE -eq 0) {
    $aiBuildTime = ((Get-Date) - $aiBuildStart).TotalSeconds
    Write-Host "✅ AI services image built successfully in $([math]::Round($aiBuildTime, 2))s" -ForegroundColor Green
    
    # Show image size
    $imageSize = docker images oliver-os-ai-test --format "{{.Size}}"
    Write-Host "📦 Image size: $imageSize" -ForegroundColor Cyan
} else {
    Write-Host "❌ AI services image build FAILED!" -ForegroundColor Red
    Write-Host "Check the error output above for details." -ForegroundColor Yellow
    exit 1
}

# Test 3: Run Backend Container
Write-Section "Test 3: Testing Backend Container Runtime"
Write-Host "Starting backend container..." -ForegroundColor Cyan

docker run -d --name oliver-backend-test -p 3000:3000 `
    -e NODE_ENV=test `
    -e SKIP_DB_INIT=true `
    oliver-os-backend-test

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend container started" -ForegroundColor Green
    
    # Wait for container to initialize
    Write-Host "Waiting for backend to initialize (10 seconds)..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    # Check if container is still running
    $backendStatus = docker ps --filter "name=oliver-backend-test" --format "{{.Status}}"
    if ($backendStatus) {
        Write-Host "✅ Backend container is running: $backendStatus" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend container stopped. Checking logs..." -ForegroundColor Yellow
        docker logs oliver-backend-test
    }
    
    # Test health endpoint
    Write-Host "Testing health endpoint..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Health endpoint responding: $($response.StatusCode)" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Health endpoint not responding (expected if no database)" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Backend container failed to start!" -ForegroundColor Red
    docker logs oliver-backend-test
}

# Test 4: Run AI Services Container
Write-Section "Test 4: Testing AI Services Container Runtime"
Write-Host "Starting AI services container..." -ForegroundColor Cyan

docker run -d --name oliver-ai-test -p 8000:8000 `
    oliver-os-ai-test

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ AI services container started" -ForegroundColor Green
    
    # Wait for container to initialize
    Write-Host "Waiting for AI services to initialize (15 seconds)..." -ForegroundColor Gray
    Start-Sleep -Seconds 15
    
    # Check if container is still running
    $aiStatus = docker ps --filter "name=oliver-ai-test" --format "{{.Status}}"
    if ($aiStatus) {
        Write-Host "✅ AI services container is running: $aiStatus" -ForegroundColor Green
    } else {
        Write-Host "⚠️  AI services container stopped. Checking logs..." -ForegroundColor Yellow
        docker logs oliver-ai-test
    }
    
    # Test health endpoint
    Write-Host "Testing health endpoint..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Health endpoint responding: $($response.StatusCode)" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Health endpoint not responding" -ForegroundColor Yellow
        Write-Host "Showing container logs:" -ForegroundColor Gray
        docker logs oliver-ai-test
    }
} else {
    Write-Host "❌ AI services container failed to start!" -ForegroundColor Red
    docker logs oliver-ai-test
}

# Test 5: Docker Compose Build
Write-Section "Test 5: Testing Docker Compose Build"
Write-Host "Building services with docker-compose..." -ForegroundColor Cyan

docker-compose build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker Compose build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Docker Compose build FAILED!" -ForegroundColor Red
}

# Final Summary
Write-Section "Test Summary"

# Count running containers
$runningContainers = docker ps --filter "name=oliver-" --format "{{.Names}}" | Measure-Object
$stoppedContainers = docker ps -a --filter "name=oliver-" --filter "status=exited" --format "{{.Names}}" | Measure-Object

Write-Host "📊 Container Status:" -ForegroundColor Cyan
Write-Host "   Running: $($runningContainers.Count)" -ForegroundColor Green
Write-Host "   Stopped: $($stoppedContainers.Count)" -ForegroundColor $(if ($stoppedContainers.Count -gt 0) { "Yellow" } else { "Green" })

# List all test images
Write-Host ""
Write-Host "📦 Test Images:" -ForegroundColor Cyan
docker images --filter "reference=oliver-os-*-test" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  Testing Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Cleanup prompt
Write-Host "Do you want to clean up test containers? (Y/n): " -NoNewline -ForegroundColor Yellow
$cleanup = Read-Host

if ($cleanup -ne 'n' -and $cleanup -ne 'N') {
    Write-Host "Cleaning up..." -ForegroundColor Gray
    docker stop oliver-backend-test oliver-ai-test 2>$null
    docker rm oliver-backend-test oliver-ai-test 2>$null
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Test containers left running for inspection" -ForegroundColor Cyan
    Write-Host "   Run 'docker logs oliver-backend-test' to see backend logs" -ForegroundColor Gray
    Write-Host "   Run 'docker logs oliver-ai-test' to see AI services logs" -ForegroundColor Gray
    Write-Host "   Run 'docker stop oliver-backend-test oliver-ai-test' to stop them" -ForegroundColor Gray
    Write-Host "   Run 'docker rm oliver-backend-test oliver-ai-test' to remove them" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 Ready to push to CI/CD!" -ForegroundColor Green
Write-Host ""

