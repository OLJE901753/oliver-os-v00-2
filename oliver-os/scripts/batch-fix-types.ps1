#!/usr/bin/env pwsh
# Batch Type Fix Script
# Automatically fixes common 'any' type patterns across multiple files

$ErrorActionPreference = "Stop"

# Files to fix in batch
$filesToFix = @(
    "src/services/review/self-review-service.ts",
    "src/services/memory/contextual-suggestion-engine.ts",
    "src/services/review/improvement-suggestions-service.ts"
)

Write-Host "🔧 Batch Type Fix Script" -ForegroundColor Cyan
Write-Host "📝 This script will apply common type fixes across $($filesToFix.Count) files`n"

# Check current status
Write-Host "📊 Current status:" -ForegroundColor Yellow
$content = Get-Content eslint-unix.txt | Where-Object { $_ -match 'no-explicit-any' }
Write-Host "  Total issues: $($content.Count)" -ForegroundColor White

# Show next steps
Write-Host "`n✅ Next steps:" -ForegroundColor Green
Write-Host "  1. Apply common types from src/types/common-types.ts"
Write-Host "  2. Fix memory service access patterns"
Write-Host "  3. Fix context builder patterns"
Write-Host "  4. Fix array type declarations"
Write-Host "`n💡 Tip: Run 'npm run lint:fix' after each batch to verify changes"

Write-Host "`n📋 Files to fix:" -ForegroundColor Yellow
foreach ($file in $filesToFix) {
    $issueCount = ($content | Where-Object { $_ -match [regex]::Escape($file) }).Count
    Write-Host "  $issueCount issues - $file" -ForegroundColor White
}

Write-Host "`n⚠️  Manual fixes still required - this script prepares the foundation" -ForegroundColor Yellow
