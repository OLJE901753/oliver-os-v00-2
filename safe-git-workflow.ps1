# Safe Git Workflow Script for Oliver-OS
# BMAD Method - Break, Map, Automate, Document
# For the honor, not the glory—by the people, for the people.

param(
    [string]$Action = "help",
    [string]$BranchName = "",
    [string]$CommitMessage = "",
    [switch]$Force = $false
)

# Color functions for better output
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }

# Safety checks
function Test-SafeBranch {
    param([string]$Branch)
    
    $protectedBranches = @("main", "master", "production", "prod")
    
    if ($protectedBranches -contains $Branch) {
        Write-Error "CRITICAL: Attempting to push to protected branch '$Branch'!"
        Write-Warning "Protected branches: $($protectedBranches -join ', ')"
        Write-Info "Use a feature branch instead (e.g., feature/your-feature-name)"
        return $false
    }
    
    return $true
}

function Get-CurrentBranch {
    try {
        $branch = git branch --show-current
        return $branch.Trim()
    }
    catch {
        Write-Error "Failed to get current branch"
        return $null
    }
}

function Show-GitStatus {
    Write-Info "Current Git Status:"
    Write-Host "==================" -ForegroundColor Gray
    
    $currentBranch = Get-CurrentBranch
    Write-Info "Current Branch: $currentBranch"
    
    # Check if we're on a protected branch
    if (-not (Test-SafeBranch $currentBranch)) {
        Write-Warning "You are on a protected branch! Switch to a feature branch immediately."
        return $false
    }
    
    # Show status
    git status --short
    
    # Count changes
    $modified = (git diff --name-only).Count
    $untracked = (git ls-files --others --exclude-standard).Count
    
    Write-Info "Modified files: $modified"
    Write-Info "Untracked files: $untracked"
    
    return $true
}

function New-SafeBranch {
    param([string]$BranchName)
    
    if ([string]::IsNullOrEmpty($BranchName)) {
        Write-Error "Branch name is required"
        return $false
    }
    
    if (-not (Test-SafeBranch $BranchName)) {
        return $false
    }
    
    try {
        Write-Info "Creating new branch: $BranchName"
        git checkout -b $BranchName
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Successfully created and switched to branch: $BranchName"
            return $true
        } else {
            Write-Error "Failed to create branch: $BranchName"
            return $false
        }
    }
    catch {
        Write-Error "Error creating branch: $_"
        return $false
    }
}

function Add-AndCommit {
    param([string]$Message)
    
    if ([string]::IsNullOrEmpty($Message)) {
        Write-Error "Commit message is required"
        return $false
    }
    
    $currentBranch = Get-CurrentBranch
    if (-not (Test-SafeBranch $currentBranch)) {
        return $false
    }
    
    try {
        Write-Info "Adding all changes..."
        git add .
        
        Write-Info "Committing with message: '$Message'"
        git commit -m $Message
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Successfully committed changes to branch: $currentBranch"
            return $true
        } else {
            Write-Error "Failed to commit changes"
            return $false
        }
    }
    catch {
        Write-Error "Error during commit: $_"
        return $false
    }
}

function Push-SafeBranch {
    param([string]$BranchName = "", [switch]$Force = $false)
    
    if ([string]::IsNullOrEmpty($BranchName)) {
        $BranchName = Get-CurrentBranch
    }
    
    if (-not (Test-SafeBranch $BranchName)) {
        return $false
    }
    
    try {
        Write-Info "Pushing branch '$BranchName' to origin..."
        
        if ($Force) {
            Write-Warning "Using force push - this will overwrite remote changes!"
            git push --force-with-lease origin $BranchName
        } else {
            git push -u origin $BranchName
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Successfully pushed branch '$BranchName' to GitHub!"
            Write-Info "Your main/master branch is safe - no risk of breaking working code!"
            return $true
        } else {
            Write-Error "Failed to push branch '$BranchName'"
            Write-Info "Try: git pull origin $BranchName first, or use -Force flag"
            return $false
        }
    }
    catch {
        Write-Error "Error during push: $_"
        return $false
    }
}

function Show-Help {
    Write-Host @"
🚀 Safe Git Workflow for Oliver-OS
==================================

USAGE:
  .\safe-git-workflow.ps1 -Action <command> [options]

COMMANDS:
  status              Show current git status and safety check
  new-branch          Create a new safe feature branch
  commit              Add and commit changes with message
  push                Push current branch to GitHub safely
  full-workflow       Complete workflow: commit + push
  help                Show this help message

EXAMPLES:
  .\safe-git-workflow.ps1 -Action status
  .\safe-git-workflow.ps1 -Action new-branch -BranchName "feature/new-ui"
  .\safe-git-workflow.ps1 -Action commit -CommitMessage "Add new features"
  .\safe-git-workflow.ps1 -Action push
  .\safe-git-workflow.ps1 -Action full-workflow -CommitMessage "Complete feature implementation"

SAFETY FEATURES:
  ✅ Prevents pushing to protected branches (main, master, production)
  ✅ Always pushes to feature branches
  ✅ Shows clear status and warnings
  ✅ Protects your working main code

PROTECTED BRANCHES: main, master, production, prod
"@ -ForegroundColor White
}

# Main execution
switch ($Action.ToLower()) {
    "status" {
        Show-GitStatus
    }
    "new-branch" {
        New-SafeBranch $BranchName
    }
    "commit" {
        Add-AndCommit $CommitMessage
    }
    "push" {
        Push-SafeBranch $BranchName $Force
    }
    "full-workflow" {
        if ([string]::IsNullOrEmpty($CommitMessage)) {
            Write-Error "Commit message is required for full workflow"
            exit 1
        }
        
        Write-Info "Starting full safe workflow..."
        
        if (Show-GitStatus) {
            if (Add-AndCommit $CommitMessage) {
                Push-SafeBranch "" $Force
            }
        }
    }
    "help" {
        Show-Help
    }
    default {
        Write-Error "Unknown action: $Action"
        Show-Help
    }
}
