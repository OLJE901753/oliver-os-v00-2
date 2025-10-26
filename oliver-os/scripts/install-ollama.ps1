# Install Ollama for Oliver-OS
# PowerShell script to install Ollama and pull the required model

Write-Host "🚀 Installing Ollama for Oliver-OS..." -ForegroundColor Cyan
Write-Host ""

# Check if Ollama is already installed
$ollamaCheck = Get-Command ollama -ErrorAction SilentlyContinue

if ($ollamaCheck) {
    Write-Host "✅ Ollama is already installed!" -ForegroundColor Green
    ollama --version
} else {
    Write-Host "📥 Ollama not found. Installing..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please choose an installation method:" -ForegroundColor Cyan
    Write-Host "1. Download and run installer from https://ollama.ai"
    Write-Host "2. Use winget (Windows Package Manager)"
    Write-Host ""
    
    $choice = Read-Host "Enter choice"
    
    if ($choice -eq "2") {
        Write-Host "Installing via winget..." -ForegroundColor Yellow
        winget install Ollama.Ollama
        Write-Host "✅ Installation complete!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "📥 Please download Ollama from:" -ForegroundColor Cyan
        Write-Host "   https://ollama.ai" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "After installation, run this script again to pull the model." -ForegroundColor Yellow
        exit
    }
}

Write-Host ""
Write-Host "🔍 Checking if model is already installed..." -ForegroundColor Cyan

$models = ollama list 2>$null
if ($models -match "llama3.1:8b") {
    Write-Host "✅ Model llama3.1:8b is already installed!" -ForegroundColor Green
} else {
    Write-Host "📥 Model not found. Downloading llama3.1:8b..." -ForegroundColor Yellow
    Write-Host "⏳ This may take a few minutes (~4.7GB download)..." -ForegroundColor Yellow
    Write-Host ""
    
    ollama pull llama3.1:8b
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Model downloaded successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Failed to download model. Please try manually:" -ForegroundColor Red
        Write-Host "   ollama pull llama3.1:8b" -ForegroundColor Yellow
        exit
    }
}

Write-Host ""
Write-Host "🧪 Testing Ollama connection..." -ForegroundColor Cyan
ollama run llama3.1:8b "Test message for Oliver-OS"

Write-Host ""
Write-Host "✅ Ollama installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Now you can start the Python chat:" -ForegroundColor Cyan
Write-Host "  pnpm chat:python" -ForegroundColor Yellow
Write-Host ""
Write-Host "Or:" -ForegroundColor Cyan
Write-Host "  py ai-services/cli/unified_chat.py" -ForegroundColor Yellow

