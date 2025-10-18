# BMAD Global Installation Script for Windows
# For the honor, not the glory—by the people, for the people.

Write-Host "🚀 Installing BMAD as Global Development Tool..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if pnpm is installed
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm version: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
}

# Navigate to bmad-global directory
Set-Location "bmad-global"

# Install dependencies
Write-Host "📦 Installing BMAD dependencies..." -ForegroundColor Yellow
pnpm install

# Build BMAD
Write-Host "🔨 Building BMAD..." -ForegroundColor Yellow
pnpm build

# Install globally
Write-Host "🌍 Installing BMAD globally..." -ForegroundColor Yellow
pnpm link --global

# Return to parent directory
Set-Location ".."

Write-Host "✅ BMAD installed globally!" -ForegroundColor Green
Write-Host "🎯 You can now use 'bmad' command from anywhere!" -ForegroundColor Blue
Write-Host ""
Write-Host "Quick start:" -ForegroundColor Cyan
Write-Host "  cd oliver-os" -ForegroundColor White
Write-Host "  bmad init" -ForegroundColor White
Write-Host "  bmad analyze" -ForegroundColor White