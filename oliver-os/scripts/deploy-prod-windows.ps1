# Oliver-OS Production Deployment Script for Windows
# Builds and starts production servers

Write-Host "🚀 Starting Oliver-OS Production Deployment..." -ForegroundColor Cyan

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend dependencies failed" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Push-Location "frontend"
try {
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend dependencies failed" -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

Write-Host "🔨 Building backend..." -ForegroundColor Yellow
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    exit 1
}

Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
Push-Location "frontend"
try {
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend build failed" -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

Write-Host "🚀 Starting production servers..." -ForegroundColor Green
Write-Host "Backend: http://localhost:3000" -ForegroundColor Gray
Write-Host "Frontend: http://localhost:4173" -ForegroundColor Gray

# Start backend in background
Start-Process -FilePath "pnpm" -ArgumentList "start" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend preview in background
Push-Location "frontend"
try {
    Start-Process -FilePath "pnpm" -ArgumentList "preview" -WindowStyle Normal
} finally {
    Pop-Location
}

Write-Host "✅ Production servers started!" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop all servers..." -ForegroundColor Yellow

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "🛑 Stopping servers..." -ForegroundColor Yellow
}
