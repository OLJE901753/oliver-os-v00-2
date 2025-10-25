# Smart Assistance Monitoring Dashboard Startup Script
Write-Host "🚀 Starting Smart Assistance Monitoring Dashboard..." -ForegroundColor Green

# Navigate to monitoring dashboard directory
Set-Location "monitoring-dashboard"

# Check if node_modules exists, if not install dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
}

# Start the development server
Write-Host "🎯 Starting monitoring dashboard on port 3001..." -ForegroundColor Green
Write-Host "   Dashboard URL: http://localhost:3001" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop the dashboard" -ForegroundColor Gray
Write-Host ""

pnpm dev
