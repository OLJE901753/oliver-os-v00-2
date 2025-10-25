# GitHub Workflow Analyzer

## Overview

The GitHub Workflow Analyzer is a comprehensive tool that automatically fetches and analyzes **any GitHub Actions workflow** logs, detects failures, and generates targeted fix commands.

## Features

✅ **Universal GitHub UI Workflow** - Works with GitHub Actions UI specific  
✅ **Automatic Workflow Detection** - Finds any workflow across all workflow files by commit hash or run number  
✅ **Job Log Analysis** - Fetches and parses job logs from GitHub API  
✅ **Error Detection** - Identifies missing artifacts, ESLint errors, TypeScript errors, and more  
✅ **Automated Fix Generation** - Produces targeted fix commands based on detected issues  
✅ **Cross-Platform** - Works on Windows PowerShell without requiring grep or Unix tools  

## Usage

### Basic Command

```bash
pnpm ci:analyze-workflow <identifier>
```

### Examples

```bash
# Analyze by commit hash
pnpm ci:analyze-workflow 846caf0

# Analyze by run number
pnpm ci:analyze-workflow 18808551431

# Use "latest" for most recent run
pnpm ci:analyze-workflow latest
```

### In Cursor Chat

Simply say one of these formats:
```
"Enhanced Smart Assistance CI/CD Pipeline #6: Commit 846caf0"
"Smart Assistance CI/CD Pipeline #22: Commit da66ada"
"Docker CI/CD Pipeline #1: Commit abc123"
```

Or use any workflow identifier:
- Commit hash (e.g., `846caf0`)
- Workflow run number (e.g., `18808551431`)
- Any descriptive name that includes the commit

The system will:
1. Search across **ALL workflows** to find the matching run
2. Parse the workflow identifier
3. Fetch the workflow run from GitHub
4. Analyze all job logs in order
5. Generate fix commands
6. Save results to `github-workflow-fixes.json`

## How It Works

### 1. Workflow Resolution

The system searches across **all workflows** to find the matching run:

```typescript
// First, search all workflows
gh run list --repo OLJE901753/oliver-os-v00-2 --limit 50

// If needed, can also search specific workflows
gh run list --repo OLJE901753/oliver-os-v00-2 --workflow=ci.yml
gh run list --repo OLJE901753/oliver-os-v00-2 --workflow=ci-enhanced.yml
```

This means you can analyze:
- ✅ Enhanced Smart Assistance CI/CD Pipeline
- ✅ Smart Assistance CI/CD Pipeline  
- ✅ Docker CI/CD Pipeline
- ✅ Any other workflow in the repository

### 2. Job Analysis

For each job in the workflow run:
- Fetches job details using GitHub API
- Downloads job logs
- Parses logs for errors and warnings
- Detects missing artifacts

### 3. Error Patterns Detected

- ❌ Missing files/artifacts (`No files were found`)
- ❌ ESLint errors (`Unexpected any`, `eslint`)
- ❌ TypeScript errors (`TS`, `typescript`)
- ❌ CI report failures
- ⚠️ General warnings

### 4. Fix Command Generation

Based on detected errors:
- `pnpm ci:generate-report` - Generate missing CI reports
- `pnpm lint:fix` - Fix ESLint errors
- `pnpm type-check` - Verify TypeScript compilation

## Output Files

### github-workflow-fixes.json

```json
{
  "timestamp": "2025-10-25T21:00:00.000Z",
  "fixes": [
    "pnpm ci:generate-report",
    "pnpm lint:fix"
  ],
  "jobs": [
    {
      "name": "Enhanced Lint & Type Check",
      "conclusion": "failure",
      "errorCount": 3,
      "warningCount": 2
    }
  ]
}
```

## Architecture

```
analyze-github-workflow.ts
├── resolveWorkflowRun()       # Find workflow by commit/ID
├── fetchJobLogs()              # Fetch job details from API
├── analyzeJob()                # Analyze individual job logs
│   ├── Fetch logs via API
│   ├── Parse logs in JavaScript
│   └── Extract errors/warnings
└── generateFixCommands()       # Create fix commands
```

## Integration

The analyzer integrates with:
- **GitHub CLI** (`gh`) - For API access
- **GitHub Actions API** - For fetching job logs
- **PowerShell** - Windows-compatible parsing
- **Cursor Chat** - Natural language interface

## Example Workflow Analysis

```bash
$ pnpm ci:analyze-workflow 846caf0

🔍 GitHub Workflow Analyzer
================================
📁 Repository: OLJE901753/oliver-os-v00-2
🔍 Analyzing: 846caf0

Found 6 Enhanced Smart Assistance workflow runs
Matched run: Enhanced Smart Assistance CI/CD Pipeline (ID: 18808551431)

📋 Analyzing Job: Enhanced Lint & Type Check
   Status: failure
   ❌ Found 3 errors
      - Missing file/artifact: Enhanced Lint & Type Check...
      
📋 Analyzing Job: Cursor Integration Report
   Status: failure
   ❌ Found 1 errors
      - Cursor Integration Report Generate...

⚡ Generated Fix Commands:
================================

1. Generate missing CI reports:
   pnpm ci:generate-report

2. Fix ESLint errors:
   pnpm lint:fix

💾 Fix commands saved to: github-workflow-fixes.json
```

## Troubleshooting

### Issue: "Could not find workflow run"
**Solution**: Check that the commit hash or run ID exists in the Enhanced Smart Assistance workflow

### Issue: "unknown flag: --output"
**Solution**: The GitHub CLI version may not support this flag. The system will fall back to alternative methods.

### Issue: Job logs not found
**Solution**: Ensure GitHub CLI is authenticated (`gh auth login`)

## Future Enhancements

- [ ] Support for multiple workflow types
- [ ] Automatic fix application
- [ ] Integration with Cursor AI for auto-fix suggestions
- [ ] Slack/email notifications
- [ ] Historical trend analysis

## BMAD Compliance

Following BMAD principles:
- **Break**: Analyzes individual jobs separately
- **Map**: Maps errors to specific fix commands
- **Automate**: Fully automated workflow analysis
- **Document**: Comprehensive logging and output files

## License

Part of the Oliver-OS project.
