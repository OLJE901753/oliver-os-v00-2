# Oliver-OS Database Setup Script
# Sets up all required databases using Docker Compose

param(
    [switch]$Start,
    [switch]$Stop,
    [switch]$Restart,
    [switch]$Status,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host ""
    Write-Host "Oliver-OS Database Setup Script" -ForegroundColor Cyan
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\scripts\setup-databases.ps1 -Start       # Start all databases"
    Write-Host "  .\scripts\setup-databases.ps1 -Stop        # Stop all databases"
    Write-Host "  .\scripts\setup-databases.ps1 -Restart     # Restart all databases"
    Write-Host "  .\scripts\setup-databases.ps1 -Status      # Check database status"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\scripts\setup-databases.ps1 -Start"
    Write-Host ""
}

function Start-Databases {
    Write-Host ""
    Write-Host "🚀 Starting Oliver-OS Databases..." -ForegroundColor Green
    Write-Host ""
    
    $dbDir = Join-Path $PSScriptRoot ".." "database"
    
    if (-not (Test-Path $dbDir)) {
        Write-Host "❌ Database directory not found: $dbDir" -ForegroundColor Red
        Write-Host "   Please ensure you're running this from the oliver-os directory" -ForegroundColor Yellow
        exit 1
    }
    
    Push-Location $dbDir
    
    try {
        Write-Host "📦 Starting Docker Compose services..." -ForegroundColor Cyan
        docker-compose up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Databases started successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Database Services:" -ForegroundColor Cyan
            Write-Host "  - PostgreSQL: localhost:5432"
            Write-Host "  - Redis: localhost:6379"
            Write-Host "  - Neo4j: localhost:7474 (HTTP), localhost:7687 (Bolt)"
            Write-Host "  - ChromaDB: localhost:8001"
            Write-Host "  - Elasticsearch: localhost:9200"
            Write-Host ""
            Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
            
            Write-Host ""
            Write-Host "📊 Checking service status..." -ForegroundColor Cyan
            docker-compose ps
        } else {
            Write-Host "❌ Failed to start databases" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ Error starting databases: $_" -ForegroundColor Red
        exit 1
    } finally {
        Pop-Location
    }
}

function Stop-Databases {
    Write-Host ""
    Write-Host "🛑 Stopping Oliver-OS Databases..." -ForegroundColor Yellow
    Write-Host ""
    
    $dbDir = Join-Path $PSScriptRoot ".." "database"
    
    if (-not (Test-Path $dbDir)) {
        Write-Host "❌ Database directory not found: $dbDir" -ForegroundColor Red
        exit 1
    }
    
    Push-Location $dbDir
    
    try {
        docker-compose down
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Databases stopped successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to stop databases" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ Error stopping databases: $_" -ForegroundColor Red
        exit 1
    } finally {
        Pop-Location
    }
}

function Restart-Databases {
    Write-Host ""
    Write-Host "🔄 Restarting Oliver-OS Databases..." -ForegroundColor Cyan
    Write-Host ""
    
    Stop-Databases
    Start-Sleep -Seconds 3
    Start-Databases
}

function Get-DatabaseStatus {
    Write-Host ""
    Write-Host "📊 Oliver-OS Database Status" -ForegroundColor Cyan
    Write-Host ""
    
    $dbDir = Join-Path $PSScriptRoot ".." "database"
    
    if (-not (Test-Path $dbDir)) {
        Write-Host "❌ Database directory not found: $dbDir" -ForegroundColor Red
        exit 1
    }
    
    Push-Location $dbDir
    
    try {
        docker-compose ps
        
        Write-Host ""
        Write-Host "🔍 Testing connections..." -ForegroundColor Cyan
        Write-Host ""
        
        # Test PostgreSQL
        Write-Host "Testing PostgreSQL..." -NoNewline
        try {
            $pgTest = docker-compose exec -T postgres pg_isready -U postgres 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host " ✅" -ForegroundColor Green
            } else {
                Write-Host " ❌" -ForegroundColor Red
            }
        } catch {
            Write-Host " ❌" -ForegroundColor Red
        }
        
        # Test Redis
        Write-Host "Testing Redis..." -NoNewline
        try {
            $redisTest = docker-compose exec -T redis redis-cli ping 2>&1
            if ($redisTest -match "PONG") {
                Write-Host " ✅" -ForegroundColor Green
            } else {
                Write-Host " ❌" -ForegroundColor Red
            }
        } catch {
            Write-Host " ❌" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "❌ Error checking database status: $_" -ForegroundColor Red
        exit 1
    } finally {
        Pop-Location
    }
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

if ($Start) {
    Start-Databases
} elseif ($Stop) {
    Stop-Databases
} elseif ($Restart) {
    Restart-Databases
} elseif ($Status) {
    Get-DatabaseStatus
} else {
    Write-Host "❌ No action specified. Use -Help for usage information." -ForegroundColor Red
    Show-Help
    exit 1
}

