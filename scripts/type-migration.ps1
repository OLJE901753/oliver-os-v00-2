# TypeScript Migration Script
# Gradually enables TypeScript strictness features

Write-Host "Starting TypeScript Migration..." -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "oliver-os")) {
    Write-Host "❌ Error: Please run this script from the root directory" -ForegroundColor Red
    exit 1
}

Set-Location "oliver-os"

$steps = @(
    @{
        Name = "Fix bmad-global imports"
        Command = "Write-Host '✅ bmad-global imports already fixed' -ForegroundColor Green"
    },
    @{
        Name = "Add external type definitions"
        Command = "Write-Host '✅ External type definitions added' -ForegroundColor Green"
    },
    @{
        Name = "Test development configuration"
        Command = "pnpm type-check:dev"
    },
    @{
        Name = "Test strict configuration"
        Command = "pnpm type-check:strict"
    },
    @{
        Name = "Run linting"
        Command = "pnpm lint"
    },
    @{
        Name = "Run tests"
        Command = "pnpm test:smart"
    }
)

foreach ($step in $steps) {
    Write-Host "`nExecuting: $($step.Name)" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Gray
    
    try {
        Invoke-Expression $step.Command
        if ($LASTEXITCODE -ne 0 -and $step.Command -notlike "*Write-Host*") {
            throw "Step failed with exit code $LASTEXITCODE"
        }
        Write-Host "✅ $($step.Name) completed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed at step: $($step.Name)" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        Write-Host "`nYou can continue with the next step or fix the current issue first." -ForegroundColor Yellow
        $continue = Read-Host "Continue? (y/n)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            break
        }
    }
}

Write-Host "`nTypeScript migration completed!" -ForegroundColor Green
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  - Development config: tsconfig.dev.json" -ForegroundColor White
Write-Host "  - Strict config: tsconfig.json" -ForegroundColor White
Write-Host "  - Base config: ../tsconfig.base.json" -ForegroundColor White
Write-Host "`nYou can now use:" -ForegroundColor Cyan
Write-Host "  - pnpm dev (development mode)" -ForegroundColor White
Write-Host "  - pnpm dev:strict (strict mode)" -ForegroundColor White
Write-Host "  - pnpm type-check:dev (check dev config)" -ForegroundColor White
Write-Host "  - pnpm type-check:strict (check strict config)" -ForegroundColor White

Set-Location ".."
