# Oliver-OS Windows-Compatible Deployment Scripts
# These scripts avoid using && which doesn't work in Windows

# Development deployment - starts both backend and frontend dev servers
# Uses PowerShell to run commands in sequence
Write-Host "🚀 Starting Oliver-OS Development Deployment..." -ForegroundColor Cyan

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

Write-Host "🚀 Starting development servers..." -ForegroundColor Green
Write-Host "Backend: http://localhost:3000" -ForegroundColor Gray
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Gray

# Start backend in background
Start-Process -FilePath "pnpm" -ArgumentList "dev" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start frontend in background
Push-Location "frontend"
try {
    Start-Process -FilePath "pnpm" -ArgumentList "dev" -WindowStyle Normal
} finally {
    Pop-Location
}

Write-Host "✅ Development servers started!" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop all servers..." -ForegroundColor Yellow

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "🛑 Stopping servers..." -ForegroundColor Yellow
}
