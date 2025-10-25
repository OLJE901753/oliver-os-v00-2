# Oliver-OS Optimized Docker Build Script
# Fixes the 473MB build context issue

Write-Host "🚀 Oliver-OS Optimized Docker Build" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check if Docker is running
Write-Host "`n📋 Checking Docker status..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Clean up any existing containers
Write-Host "`n🧹 Cleaning up existing containers..." -ForegroundColor Yellow
docker stop $(docker ps -a -q --filter "name=oliver-os-") 2>$null
docker rm $(docker ps -a -q --filter "name=oliver-os-") 2>$null

# Check build context size
Write-Host "`n📊 Analyzing build context..." -ForegroundColor Yellow
$contextSize = (Get-ChildItem -Path . -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Build context size: $([math]::Round($contextSize, 2)) MB" -ForegroundColor Cyan

if ($contextSize -gt 100) {
    Write-Host "⚠️  Build context is large. Check .dockerignore file." -ForegroundColor Yellow
} else {
    Write-Host "✅ Build context size looks good!" -ForegroundColor Green
}

# Build with optimized settings
Write-Host "`n🔨 Building Oliver-OS with optimized settings..." -ForegroundColor Yellow
Write-Host "This should be much faster now!" -ForegroundColor Cyan

# Set build arguments for optimization
$buildArgs = @(
    "--build-arg", "NODE_ENV=production",
    "--build-arg", "BUILDKIT_INLINE_CACHE=1"
)

# Build the main application
Write-Host "`n📦 Building main application..." -ForegroundColor Yellow
docker build -t oliver-os:latest -f docker/Dockerfile @buildArgs .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Main application built successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Main application build failed!" -ForegroundColor Red
    exit 1
}

# Build AI services
Write-Host "`n🤖 Building AI services..." -ForegroundColor Yellow
docker build -t oliver-os-ai:latest -f ai-services/Dockerfile ai-services/

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ AI services built successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ AI services build failed!" -ForegroundColor Red
    exit 1
}

# Start the production stack
Write-Host "`n🚀 Starting production stack..." -ForegroundColor Yellow
docker-compose -f docker/docker-compose.prod.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 Oliver-OS is now running!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "🌐 Main App: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🤖 AI Services: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "📊 Grafana: http://localhost:3001" -ForegroundColor Cyan
    Write-Host "📈 Prometheus: http://localhost:9090" -ForegroundColor Cyan
    Write-Host "🗄️  PostgreSQL: localhost:5432" -ForegroundColor Cyan
    Write-Host "🔴 Redis: localhost:6379" -ForegroundColor Cyan
    Write-Host "🔗 Neo4j: http://localhost:7474" -ForegroundColor Cyan
    Write-Host "`n💡 Use docker-compose logs to view logs" -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to start production stack!" -ForegroundColor Red
    Write-Host "Check logs with: docker-compose -f docker/docker-compose.prod.yml logs" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✨ Build optimization complete!" -ForegroundColor Green