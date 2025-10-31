# Backup Script for Oliver-OS (PowerShell)
# Phase 5.4: Automated backup and recovery
# Usage: .\scripts\backup.ps1 [create|restore|list] [backup-path]

param(
    [Parameter(Position=0)]
    [ValidateSet("create", "restore", "list")]
    [string]$Command = "create",
    
    [Parameter(Position=1)]
    [string]$BackupPath = ""
)

$ErrorActionPreference = "Stop"

# Configuration
$BackupDir = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { Join-Path $PSScriptRoot "..\backups" }
$RetentionDays = if ($env:BACKUP_RETENTION_DAYS) { [int]$env:BACKUP_RETENTION_DAYS } else { 30 }
$Timestamp = Get-Date -Format "yyyy-MM-ddTHH-mm-ss"

function Create-Backup {
    Write-Host "🔄 Creating backup..." -ForegroundColor Cyan
    
    $backupPath = Join-Path $BackupDir "backup-$Timestamp"
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    
    try {
        # Backup SQLite database
        $dbPath = Join-Path $PSScriptRoot "..\prisma\dev.db"
        if (Test-Path $dbPath) {
            $dbBackupPath = Join-Path $backupPath "database"
            New-Item -ItemType Directory -Path $dbBackupPath -Force | Out-Null
            Copy-Item $dbPath (Join-Path $dbBackupPath "dev.db")
            Write-Host "✅ Database backed up" -ForegroundColor Green
        }
        
        # Backup configuration files
        $configBackupPath = Join-Path $backupPath "config"
        New-Item -ItemType Directory -Path $configBackupPath -Force | Out-Null
        
        $configFiles = @("codebuff-config.json", "bmad-config.json", "monster-mode-config.json")
        foreach ($configFile in $configFiles) {
            $configFilePath = Join-Path $PSScriptRoot "..\$configFile"
            if (Test-Path $configFilePath) {
                Copy-Item $configFilePath (Join-Path $configBackupPath $configFile)
            }
        }
        Write-Host "✅ Configuration backed up" -ForegroundColor Green
        
        # Backup logs
        $logsPath = Join-Path $PSScriptRoot "..\logs"
        if (Test-Path $logsPath) {
            $logsBackupPath = Join-Path $backupPath "logs"
            Copy-Item $logsPath $logsBackupPath -Recurse
            Write-Host "✅ Logs backed up" -ForegroundColor Green
        }
        
        # Create manifest
        $manifest = @{
            timestamp = (Get-Date).ToUniversalTime().ToString("o")
            version = if ($env:VERSION) { $env:VERSION } else { "0.0.2" }
            components = @{
                database = Test-Path (Join-Path $backupPath "database\dev.db")
                config = $true
                logs = Test-Path (Join-Path $backupPath "logs")
            }
        } | ConvertTo-Json -Depth 10
        
        $manifest | Out-File (Join-Path $backupPath "manifest.json") -Encoding UTF8
        
        # Calculate size
        $size = (Get-ChildItem $backupPath -Recurse | Measure-Object -Property Length -Sum).Sum
        
        Write-Host "✅ Backup created successfully!" -ForegroundColor Green
        Write-Host "   Path: $backupPath" -ForegroundColor Gray
        Write-Host "   Size: $([math]::Round($size / 1MB, 2)) MB" -ForegroundColor Gray
        
        # Cleanup old backups
        Cleanup-OldBackups
        
        return $backupPath
    } catch {
        Write-Host "❌ Backup failed: $_" -ForegroundColor Red
        Remove-Item $backupPath -Recurse -Force -ErrorAction SilentlyContinue
        exit 1
    }
}

function Restore-Backup {
    if (-not $BackupPath) {
        Write-Host "❌ Please provide backup path" -ForegroundColor Red
        Write-Host "Usage: .\scripts\backup.ps1 restore <backup-path>" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "🔄 Restoring from backup: $BackupPath..." -ForegroundColor Cyan
    
    if (-not (Test-Path $BackupPath)) {
        Write-Host "❌ Backup not found: $BackupPath" -ForegroundColor Red
        exit 1
    }
    
    $manifestPath = Join-Path $BackupPath "manifest.json"
    if (-not (Test-Path $manifestPath)) {
        Write-Host "❌ Backup manifest not found" -ForegroundColor Red
        exit 1
    }
    
    try {
        $manifest = Get-Content $manifestPath | ConvertFrom-Json
        
        # Restore database
        $dbBackupPath = Join-Path $BackupPath "database\dev.db"
        if (Test-Path $dbBackupPath) {
            $dbPath = Join-Path $PSScriptRoot "..\prisma\dev.db"
            $dbDir = Split-Path $dbPath -Parent
            New-Item -ItemType Directory -Path $dbDir -Force | Out-Null
            Copy-Item $dbBackupPath $dbPath -Force
            Write-Host "✅ Database restored" -ForegroundColor Green
        }
        
        # Restore configuration
        $configBackupPath = Join-Path $BackupPath "config"
        if (Test-Path $configBackupPath) {
            $configFiles = Get-ChildItem $configBackupPath
            foreach ($configFile in $configFiles) {
                $destPath = Join-Path $PSScriptRoot "..\$($configFile.Name)"
                Copy-Item $configFile.FullName $destPath -Force
            }
            Write-Host "✅ Configuration restored" -ForegroundColor Green
        }
        
        Write-Host "✅ Backup restored successfully!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Restore failed: $_" -ForegroundColor Red
        exit 1
    }
}

function List-Backups {
    Write-Host "📋 Listing backups..." -ForegroundColor Cyan
    
    if (-not (Test-Path $BackupDir)) {
        Write-Host "No backups found" -ForegroundColor Yellow
        return
    }
    
    $backups = Get-ChildItem $BackupDir -Directory | Where-Object {
        Test-Path (Join-Path $_.FullName "manifest.json")
    } | ForEach-Object {
        $manifest = Get-Content (Join-Path $_.FullName "manifest.json") | ConvertFrom-Json
        $size = (Get-ChildItem $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum
        
        [PSCustomObject]@{
            Path = $_.FullName
            Timestamp = $manifest.timestamp
            Size = $size
        }
    } | Sort-Object -Property Timestamp -Descending
    
    if ($backups.Count -eq 0) {
        Write-Host "No backups found" -ForegroundColor Yellow
    } else {
        Write-Host "Found $($backups.Count) backup(s):`n" -ForegroundColor Green
        $index = 1
        foreach ($backup in $backups) {
            Write-Host "$index. $($backup.Path)" -ForegroundColor White
            Write-Host "   Date: $($backup.Timestamp)" -ForegroundColor Gray
            Write-Host "   Size: $([math]::Round($backup.Size / 1MB, 2)) MB" -ForegroundColor Gray
            Write-Host ""
            $index++
        }
    }
}

function Cleanup-OldBackups {
    $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
    
    Get-ChildItem $BackupDir -Directory | Where-Object {
        $manifestPath = Join-Path $_.FullName "manifest.json"
        if (Test-Path $manifestPath) {
            $manifest = Get-Content $manifestPath | ConvertFrom-Json
            $backupDate = [DateTime]::Parse($manifest.timestamp)
            return $backupDate -lt $cutoffDate
        }
        return $false
    } | ForEach-Object {
        Write-Host "🗑️  Deleting old backup: $($_.Name)" -ForegroundColor Yellow
        Remove-Item $_.FullName -Recurse -Force
    }
}

# Main execution
switch ($Command) {
    "create" {
        Create-Backup
    }
    "restore" {
        Restore-Backup
    }
    "list" {
        List-Backups
    }
}

