# Oliver-OS Build Context Analyzer
# Identifies what's causing the large build context

Write-Host "🔍 Oliver-OS Build Context Analyzer" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Function to format file sizes
function Format-FileSize {
    param([long]$Size)
    if ($Size -gt 1GB) { return "{0:N2} GB" -f ($Size / 1GB) }
    elseif ($Size -gt 1MB) { return "{0:N2} MB" -f ($Size / 1MB) }
    elseif ($Size -gt 1KB) { return "{0:N2} KB" -f ($Size / 1KB) }
    else { return "{0} bytes" -f $Size }
}

# Get current directory size
Write-Host "`n📊 Analyzing current directory..." -ForegroundColor Yellow
$totalSize = (Get-ChildItem -Path . -Recurse -Force | Measure-Object -Property Length -Sum).Sum
Write-Host "Total directory size: $(Format-FileSize $totalSize)" -ForegroundColor Cyan

# Analyze by file type
Write-Host "`n📁 Analysis by file type:" -ForegroundColor Yellow
$fileTypes = Get-ChildItem -Path . -Recurse -File | Group-Object Extension | ForEach-Object {
    $size = ($_.Group | Measure-Object -Property Length -Sum).Sum
    [PSCustomObject]@{
        Extension = if ($_.Name) { $_.Name } else { "No Extension" }
        Count = $_.Count
        Size = $size
        SizeFormatted = Format-FileSize $size
    }
} | Sort-Object Size -Descending

$fileTypes | Select-Object -First 10 | Format-Table -AutoSize

# Analyze by directory
Write-Host "`n📂 Analysis by directory:" -ForegroundColor Yellow
$dirSizes = Get-ChildItem -Path . -Directory | ForEach-Object {
    $size = (Get-ChildItem -Path $_.FullName -Recurse -Force | Measure-Object -Property Length -Sum).Sum
    [PSCustomObject]@{
        Directory = $_.Name
        Size = $size
        SizeFormatted = Format-FileSize $size
    }
} | Sort-Object Size -Descending

$dirSizes | Select-Object -First 10 | Format-Table -AutoSize

# Check for large files
Write-Host "`n📄 Largest files:" -ForegroundColor Yellow
$largeFiles = Get-ChildItem -Path . -Recurse -File | Sort-Object Length -Descending | Select-Object -First 10
$largeFiles | ForEach-Object {
    Write-Host "$(Format-FileSize $_.Length) - $($_.FullName)" -ForegroundColor Cyan
}

# Check node_modules specifically
Write-Host "`n📦 Node modules analysis:" -ForegroundColor Yellow
$nodeModules = Get-ChildItem -Path . -Recurse -Directory -Name "node_modules" | ForEach-Object {
    $path = Join-Path (Get-Location) $_
    $size = (Get-ChildItem -Path $path -Recurse -Force | Measure-Object -Property Length -Sum).Sum
    [PSCustomObject]@{
        Path = $_
        Size = $size
        SizeFormatted = Format-FileSize $size
    }
}

if ($nodeModules) {
    $nodeModules | Format-Table -AutoSize
    $totalNodeModules = ($nodeModules | Measure-Object -Property Size -Sum).Sum
    Write-Host "Total node_modules size: $(Format-FileSize $totalNodeModules)" -ForegroundColor Red
} else {
    Write-Host "No node_modules directories found" -ForegroundColor Green
}

# Check .dockerignore effectiveness
Write-Host "`n🐳 Docker ignore analysis:" -ForegroundColor Yellow
if (Test-Path ".dockerignore") {
    Write-Host "✅ .dockerignore file exists" -ForegroundColor Green
    
    # Simulate what Docker would include
    $dockerIgnoreContent = Get-Content ".dockerignore" | Where-Object { $_ -notmatch "^#" -and $_.Trim() -ne "" }
    Write-Host "Docker ignore patterns: $($dockerIgnoreContent.Count)" -ForegroundColor Cyan
    
    # Check if large directories are ignored
    $ignoredDirs = @("node_modules", "dist", "build", ".git", "coverage")
    foreach ($dir in $ignoredDirs) {
        if ($dockerIgnoreContent -contains $dir) {
            Write-Host "✅ $dir is ignored" -ForegroundColor Green
        } else {
            Write-Host "❌ $dir is NOT ignored" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ .dockerignore file not found!" -ForegroundColor Red
}

# Recommendations
Write-Host "`n💡 Recommendations:" -ForegroundColor Yellow
if ($totalSize -gt 500MB) {
    Write-Host "• Build context is too large (>500MB)" -ForegroundColor Red
    Write-Host "• Check .dockerignore file" -ForegroundColor Yellow
    Write-Host "• Consider multi-stage builds" -ForegroundColor Yellow
} elseif ($totalSize -gt 100MB) {
    Write-Host "• Build context is large but manageable" -ForegroundColor Yellow
    Write-Host "• Consider optimizing further" -ForegroundColor Yellow
} else {
    Write-Host "• Build context size looks good!" -ForegroundColor Green
}

Write-Host "`n✨ Analysis complete!" -ForegroundColor Green
