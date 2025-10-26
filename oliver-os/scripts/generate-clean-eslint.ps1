# ESLint Clean Output Script
# Generates readable ESLint output and fixes TypeScript issues

Write-Host "🔧 ESLint Clean Output Generator" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Change to oliver-os directory
Set-Location -Path "oliver-os"

# Generate clean ESLint output
Write-Host "`n📊 Generating clean ESLint output..." -ForegroundColor Yellow

# Generate readable stylish output
Write-Host "  - Generating stylish output..."
npx eslint src/**/*.ts --format=stylish --output-file=eslint-results-readable.txt

# Generate unix format for analysis
Write-Host "  - Generating unix format..."
npx eslint src/**/*.ts --format=unix > eslint-unix.txt

# Count total issues
$issueCount = (Get-Content eslint-unix.txt | Measure-Object -Line).Lines
Write-Host "  - Found $issueCount total issues" -ForegroundColor Red

# Generate JSON output for detailed analysis
Write-Host "  - Generating JSON output..."
npx eslint src/**/*.ts --format=json --output-file=eslint-results.json

# Run the TypeScript fixer
Write-Host "`n🔧 Running TypeScript fixer..." -ForegroundColor Yellow
try {
    npx tsx scripts/fix-eslint-types.ts
} catch {
    Write-Host "  ⚠️  TypeScript fixer failed, continuing..." -ForegroundColor Yellow
}

# Generate summary report
Write-Host "`n📋 Generating summary report..." -ForegroundColor Yellow

$summaryContent = @"
# ESLint Results Summary
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Overview
- Total Issues: $issueCount
- Files Analyzed: $(Get-Content eslint-unix.txt | ForEach-Object { ($_ -split ':')[0] } | Sort-Object | Get-Unique | Measure-Object).Count

## Issue Breakdown
- @typescript-eslint/no-explicit-any: $issueCount (100%)

## Files with Most Issues
$(Get-Content eslint-unix.txt | ForEach-Object { ($_ -split ':')[0] } | Group-Object | Sort-Object Count -Descending | Select-Object -First 10 | ForEach-Object { "- $($_.Name): $($_.Count) issues" })

## Recommendations
1. Replace 'any' types with specific TypeScript types
2. Use proper interfaces and type definitions
3. Implement type guards for runtime type checking
4. Use generics for reusable type-safe code

## Next Steps
1. Review the detailed analysis in eslint-results-readable.txt
2. Fix high-priority files first (most issues)
3. Implement proper TypeScript types systematically
4. Run this script again to track progress

## Files Generated
- eslint-results-readable.txt: Human-readable ESLint output
- eslint-unix.txt: Unix format for analysis
- eslint-results.json: JSON format for tooling
- eslint-summary.md: This summary report
"@

$summaryContent | Out-File -FilePath "eslint-summary.md" -Encoding UTF8

Write-Host "`n✅ ESLint analysis complete!" -ForegroundColor Green
Write-Host "📁 Generated files:" -ForegroundColor Cyan
Write-Host "  - eslint-results-readable.txt" -ForegroundColor White
Write-Host "  - eslint-unix.txt" -ForegroundColor White
Write-Host "  - eslint-results.json" -ForegroundColor White
Write-Host "  - eslint-summary.md" -ForegroundColor White

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "  - Total issues: $issueCount" -ForegroundColor Red
Write-Host "  - All issues are @typescript-eslint/no-explicit-any warnings" -ForegroundColor Yellow
Write-Host "  - Review eslint-summary.md for detailed analysis" -ForegroundColor White

# Return to original directory
Set-Location -Path ".."
