# Setup Minimax M2 Configuration
# This script helps configure Minimax API key securely

Write-Host "[*] Setting up Minimax M2 Configuration" -ForegroundColor Cyan
Write-Host ""

# Get the .env file path
$envFile = Join-Path $PSScriptRoot "..\..\.env"

if (-not (Test-Path $envFile)) {
    Write-Host "[!] .env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item "$envFile.example" $envFile -ErrorAction SilentlyContinue
    if (-not (Test-Path $envFile)) {
        Write-Host "[X] Please create .env file manually" -ForegroundColor Red
        exit 1
    }
}

# Prompt for API key if not provided as argument
$apiKey = $args[0]
if (-not $apiKey) {
    Write-Host "Enter your Minimax API Key (or press Enter to skip):" -ForegroundColor Yellow
    $apiKey = Read-Host -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey)
    $apiKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "[!] No API key provided. Skipping setup." -ForegroundColor Yellow
    exit 0
}

# Read current .env content
$envContent = Get-Content $envFile -Raw

# Update or add MINIMAX_API_KEY
if ($envContent -match "MINIMAX_API_KEY=") {
    $envContent = $envContent -replace "MINIMAX_API_KEY=.*", "MINIMAX_API_KEY=`"$apiKey`""
    Write-Host "[+] Updated MINIMAX_API_KEY" -ForegroundColor Green
} else {
    $envContent += "`nMINIMAX_API_KEY=`"$apiKey`""
    Write-Host "[+] Added MINIMAX_API_KEY" -ForegroundColor Green
}

# Update or add LLM_PROVIDER
if ($envContent -match "LLM_PROVIDER=") {
    $envContent = $envContent -replace "LLM_PROVIDER=.*", "LLM_PROVIDER=`"minimax`""
    Write-Host "[+] Updated LLM_PROVIDER to minimax" -ForegroundColor Green
} else {
    $envContent += "`nLLM_PROVIDER=`"minimax`""
    Write-Host "[+] Added LLM_PROVIDER" -ForegroundColor Green
}

# Ensure MINIMAX_BASE_URL and MINIMAX_MODEL are set
if ($envContent -notmatch "MINIMAX_BASE_URL=") {
    $envContent += "`nMINIMAX_BASE_URL=`"https://api.minimax.io/v1`""
    Write-Host "[+] Added MINIMAX_BASE_URL" -ForegroundColor Green
}
if ($envContent -notmatch "MINIMAX_MODEL=") {
    $envContent += "`nMINIMAX_MODEL=`"MiniMax-M2`""
    Write-Host "[+] Added MINIMAX_MODEL" -ForegroundColor Green
}

# Write back to file
Set-Content -Path $envFile -Value $envContent -NoNewline

Write-Host ""
Write-Host "[*] Minimax M2 configuration complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test the configuration: python ai-services/examples/minimax_chat.py"
Write-Host "  2. Start the unified chat: python ai-services/cli/unified_chat.py"
Write-Host "  3. Start the FastAPI server: cd ai-services; python main.py"
Write-Host ""
Write-Host "[!] Remember: Never commit .env file to git!" -ForegroundColor Red
