# Enhanced BMAD Global Installation Script
# For the honor, not the glory—by the people, for the people.

Write-Host "🚀 Installing BMAD Method Enhanced Edition..." -ForegroundColor Cyan

# Check Node.js installation
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Gray
    exit 1
}

$nodeVersion = node --version
Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green

# Check pnpm installation
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  pnpm not found. Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install pnpm. Please install manually: npm install -g pnpm" -ForegroundColor Red
        exit 1
    }
}

$pnpmVersion = pnpm --version
Write-Host "✅ pnpm version: $pnpmVersion" -ForegroundColor Green

# Navigate to bmad-global directory
$bmadPath = Join-Path $PSScriptRoot "bmad-global"
if (!(Test-Path $bmadPath)) {
    Write-Host "❌ BMAD directory not found: $bmadPath" -ForegroundColor Red
    exit 1
}

Set-Location $bmadPath
Write-Host "📁 Working directory: $(Get-Location)" -ForegroundColor Gray

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Build the project
Write-Host "`n🔨 Building BMAD Enhanced Edition..." -ForegroundColor Yellow
pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Link globally
Write-Host "`n🔗 Linking BMAD globally..." -ForegroundColor Yellow
pnpm link --global
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link globally" -ForegroundColor Red
    exit 1
}

# Verify installation
Write-Host "`n✅ Verifying installation..." -ForegroundColor Yellow
$bmadVersion = bmad --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 BMAD Enhanced Edition installed successfully!" -ForegroundColor Green
    Write-Host "   Version: $bmadVersion" -ForegroundColor Gray
    Write-Host "   Command: bmad" -ForegroundColor Gray
} else {
    Write-Host "❌ Installation verification failed" -ForegroundColor Red
    exit 1
}

# Display usage information
Write-Host "`n📚 Usage Examples:" -ForegroundColor Cyan
Write-Host "   bmad init ai-brain-interface    # Initialize AI-brain interface project" -ForegroundColor Gray
Write-Host "   bmad analyze                     # Analyze current codebase" -ForegroundColor Gray
Write-Host "   bmad workflow full-analysis      # Run complete BMAD workflow" -ForegroundColor Gray
Write-Host "   bmad report --format html        # Generate HTML report" -ForegroundColor Gray
Write-Host "   bmad status                      # Show system status" -ForegroundColor Gray

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Navigate to your project directory" -ForegroundColor Gray
Write-Host "   2. Run: bmad init <project-type>" -ForegroundColor Gray
Write-Host "   3. Start using BMAD methodology!" -ForegroundColor Gray

Write-Host "`n🌟 For the honor, not the glory—by the people, for the people." -ForegroundColor Magenta
