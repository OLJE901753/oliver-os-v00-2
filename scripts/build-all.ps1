# Oliver-OS Build Pipeline
# Builds all components in the correct order

Write-Host "🚀 Starting Oliver-OS Build Pipeline..." -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "oliver-os")) {
    Write-Host "❌ Error: Please run this script from the root directory" -ForegroundColor Red
    exit 1
}

# Build bmad-global first
Write-Host "📦 Building bmad-global..." -ForegroundColor Blue
Set-Location "bmad-global"
try {
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        throw "bmad-global build failed"
    }
    Write-Host "✅ bmad-global built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ bmad-global build failed: $_" -ForegroundColor Red
    Set-Location ".."
    exit 1
}
Set-Location ".."

# Build oliver-os
Write-Host "🔧 Building oliver-os..." -ForegroundColor Green
Set-Location "oliver-os"
try {
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        throw "oliver-os build failed"
    }
    Write-Host "✅ oliver-os built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ oliver-os build failed: $_" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# Build client
Write-Host "💻 Building client..." -ForegroundColor Yellow
Set-Location "client"
try {
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        throw "client build failed"
    }
    Write-Host "✅ client built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ client build failed: $_" -ForegroundColor Red
    Set-Location ".."
    exit 1
}
Set-Location ".."

# Build frontend
Write-Host "🎨 Building frontend..." -ForegroundColor Magenta
Set-Location "frontend"
try {
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        throw "frontend build failed"
    }
    Write-Host "✅ frontend built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ frontend build failed: $_" -ForegroundColor Red
    Set-Location ".."
    exit 1
}
Set-Location ".."

# Build monitoring dashboard
Write-Host "📊 Building monitoring dashboard..." -ForegroundColor Cyan
Set-Location "monitoring-dashboard"
try {
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        throw "monitoring dashboard build failed"
    }
    Write-Host "✅ monitoring dashboard built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ monitoring dashboard build failed: $_" -ForegroundColor Red
    Set-Location ".."
    exit 1
}
Set-Location ".."

Write-Host "🎉 All builds completed successfully!" -ForegroundColor Green
Write-Host "🚀 Oliver-OS is ready for deployment!" -ForegroundColor Cyan
