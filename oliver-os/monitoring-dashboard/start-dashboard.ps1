# Smart Assistance Monitoring Dashboard Startup Script
# This script starts the monitoring dashboard on port 3001

Write-Host "🚀 Starting Smart Assistance Monitoring Dashboard..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check if pnpm is installed
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm version: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ pnpm is not installed. Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
}

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
}

# Check if Smart Assistance System is running
Write-Host "🔍 Checking Smart Assistance System connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Smart Assistance System is running on port 3000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Smart Assistance System is not running on port 3000" -ForegroundColor Yellow
    Write-Host "   The dashboard will start but may not have real-time data" -ForegroundColor Yellow
}

# Start the development server
Write-Host "🎯 Starting monitoring dashboard on port 3001..." -ForegroundColor Green
Write-Host "   Dashboard URL: http://localhost:3001" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop the dashboard" -ForegroundColor Gray
Write-Host ""

pnpm dev
