#!/usr/bin/env tsx

/**
 * GitHub Workflow Analyzer
 * Analyzes GitHub Actions workflow logs and generates fix commands
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import fetch from 'node-fetch';

interface WorkflowRun {
  id: string;
  name: string;
  conclusion: string;
  status: string;
  commit: string;
  branch: string;
  url: string;
}

interface JobResult {
  id?: string;
  name: string;
  conclusion: string;
  errors: string[];
  warnings: string[];
  artifacts: string[];
}

class GitHubWorkflowAnalyzer {
  private repoOwner = 'OLJE901753';
  private repoName = 'oliver-os-v00-2';
  private workflowRuns: WorkflowRun[] = [];
  private githubToken: string;

  constructor() {
    // Get GitHub token from environment or gh CLI
    this.githubToken = process.env.GITHUB_TOKEN || this.getGitHubToken();
  }

  private getGitHubToken(): string {
    try {
      const token = execSync('gh auth token', { encoding: 'utf8' }).trim();
      return token;
    } catch (error) {
      console.warn('⚠️  No GitHub token found. Some features may be limited.');
      return '';
    }
  }

  /**
   * Analyze a specific workflow run by commit or run number
   */
  async analyzeWorkflow(identifier: string): Promise<void> {
    console.log('🔍 GitHub Workflow Analyzer');
    console.log('================================');
    console.log(`📁 Repository: ${this.repoOwner}/${this.repoName}`);
    console.log(`🔍 Analyzing: ${identifier}\n`);

    try {
      // Fetch workflow run information
      const runId = await this.resolveWorkflowRun(identifier);
      
      if (!runId) {
        console.log('❌ Could not find workflow run');
        return;
      }

      console.log(`📊 Workflow Run ID: ${runId}`);

      // Fetch and analyze job logs
      const jobs = await this.fetchJobLogs(runId);
      
      // Define the exact order as shown in GitHub UI
      const jobOrder = [
        'Enhanced Lint & Type Check',
        'Enhanced Smart Assistance Tests', 
        'Enhanced Coverage Tests',
        'Enhanced Quality Gates',
        'Enhanced Security Scan',
        'Enhanced Build & Test',
        'Cursor Integration Report',
        'Enhanced Deploy to Staging',
        'Enhanced Deploy to Production',
        'Enhanced Notifications'
      ];
      
      // Sort jobs to match GitHub UI order
      const sortedJobs = jobOrder
        .map(jobName => jobs.find(job => job.name === jobName))
        .filter(job => job !== undefined);
      
      // Add any jobs not in the predefined order
      const remainingJobs = jobs.filter(job => !jobOrder.includes(job.name));
      const finalJobs = [...sortedJobs, ...remainingJobs];
      
      // Analyze each job in UI order
      for (const job of finalJobs) {
        await this.analyzeJob(job, runId);
      }

      // Generate fix commands
      const fixes = this.generateFixCommands(finalJobs);
      
      if (fixes.length === 0) {
        console.log('✅ No errors or warnings found requiring fixes');
      } else {
        console.log(`\n🎯 Summary: Generated ${fixes.length} unique fix commands`);
        console.log('💡 Run these commands to fix the detected issues:');
        fixes.forEach((fix, index) => {
          console.log(`   ${index + 1}. ${fix}`);
        });
      }

      // Save fix commands to file
      writeFileSync('github-workflow-fixes.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        fixes,
        jobs: finalJobs.map(j => ({
          name: j.name,
          conclusion: j.conclusion,
          errorCount: j.errors.length,
          warningCount: j.warnings.length
        }))
      }, null, 2));

      console.log('\n💾 Fix commands saved to: github-workflow-fixes.json');

    } catch (error) {
      console.error('❌ Analysis failed:', error);
    }
  }

  /**
   * Resolve workflow run from identifier (commit hash or run number)
   */
  private async resolveWorkflowRun(identifier: string): Promise<string | null> {
    try {
      // Try to find run across all workflows first
      let command = `gh run list --repo ${this.repoOwner}/${this.repoName} --limit 50 --json databaseId,headSha,conclusion,status,name,url,workflowName`;
      let output = execSync(command, { encoding: 'utf8' });
      let runs = JSON.parse(output);

      console.log(`Searching across all workflows...`);

      // Find matching run by commit hash or database ID
      let match = runs.find((run: any) => 
        run.headSha.startsWith(identifier) || 
        run.databaseId.toString() === identifier
      );

      // If multiple matches, prefer Enhanced Smart Assistance workflow
      if (match && match.workflowName !== 'Enhanced Smart Assistance CI/CD Pipeline') {
        const enhancedMatch = runs.find((run: any) => 
          (run.headSha.startsWith(identifier) || run.databaseId.toString() === identifier) &&
          run.workflowName === 'Enhanced Smart Assistance CI/CD Pipeline'
        );
        if (enhancedMatch) {
          match = enhancedMatch;
        }
      }

      if (match) {
        console.log(`Found run: ${match.name} (Workflow: ${match.workflowName}, ID: ${match.databaseId})`);
        return match.databaseId.toString();
      }

      // If not found and identifier looks like a workflow name pattern, try specific workflow
      if (identifier.includes('Enhanced') || identifier.includes('ci-enhanced')) {
        console.log(`Trying Enhanced Smart Assistance workflow specifically...`);
        command = `gh run list --repo ${this.repoOwner}/${this.repoName} --workflow=ci-enhanced.yml --limit 20 --json databaseId,headSha,conclusion,status,name,url,workflowName`;
        output = execSync(command, { encoding: 'utf8' });
        runs = JSON.parse(output);

        match = runs.find((run: any) => 
          run.headSha.startsWith(identifier) || 
          run.databaseId.toString() === identifier
        );

        if (match) {
          console.log(`Found in Enhanced workflow: ${match.name} (ID: ${match.databaseId})`);
          return match.databaseId.toString();
        }
      }

      console.log(`Could not find workflow run matching: ${identifier}`);
      return null;
    } catch (error) {
      console.error('Error resolving workflow run:', error);
      return null;
    }
  }

  /**
   * Fetch job logs from a workflow run using GitHub API
   */
  private async fetchJobLogs(runId: string): Promise<JobResult[]> {
    const jobs: JobResult[] = [];
    
    try {
      // Use GitHub API directly
      const response = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/actions/runs/${runId}/jobs`, {
        headers: {
          'Authorization': `Bearer ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const jobData = await response.json();
      const jobsArray = jobData.jobs || [];

      for (const job of jobsArray) {
        jobs.push({
          id: job.id?.toString(),
          name: job.name,
          conclusion: job.conclusion || 'unknown',
          errors: [],
          warnings: [],
          artifacts: []
        });
      }
    } catch (error) {
      console.error('Error fetching job logs via API:', error);
      // Fallback to gh CLI method
      try {
        const command = `gh run view ${runId} --repo ${this.repoOwner}/${this.repoName} --json jobs`;
        const output = execSync(command, { encoding: 'utf8' });
        const data = JSON.parse(output);

        for (const job of data.jobs || []) {
          jobs.push({
            name: job.name,
            conclusion: job.conclusion || 'unknown',
            errors: [],
            warnings: [],
            artifacts: []
          });
        }
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
      }
    }

    return jobs;
  }

  /**
   * Analyze individual job
   */
  private async analyzeJob(job: JobResult, runId: string): Promise<void> {
    console.log(`\n📋 Analyzing Job: ${job.name}`);
    console.log(`   Status: ${job.conclusion}`);

    try {
      let logs = '';
      
      // Try to fetch logs using GitHub API first
      if (job.id) {
        try {
          const response = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/actions/jobs/${job.id}/logs`, {
            headers: {
              'Authorization': `Bearer ${this.githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });

          if (response.ok) {
            logs = await response.text();
          } else {
            throw new Error(`API error: ${response.status}`);
          }
        } catch (apiError) {
          // Fallback to fetching full workflow logs and parsing
          const logCommand = `gh run view ${runId} --log --repo ${this.repoOwner}/${this.repoName}`;
          const allLogs = execSync(logCommand, { encoding: 'utf8' });
          // Extract job-specific logs using JavaScript
          const lines = allLogs.split('\n');
          let inJobSection = false;
          const jobLogs: string[] = [];
          
          for (const line of lines) {
            if (line.includes(job.name) && line.includes('Set up job')) {
              inJobSection = true;
            }
            if (inJobSection) {
              jobLogs.push(line);
              // Stop when we hit another job
              if (line.includes('Set up job') && !line.includes(job.name)) {
                break;
              }
            }
          }
          
          logs = jobLogs.join('\n');
        }
      } else {
        // Fallback to fetching full workflow logs and parsing
        const logCommand = `gh run view ${runId} --log --repo ${this.repoOwner}/${this.repoName}`;
        const allLogs = execSync(logCommand, { encoding: 'utf8' });
        // Extract job-specific logs using JavaScript
        const lines = allLogs.split('\n');
        let inJobSection = false;
        const jobLogs: string[] = [];
        
        for (const line of lines) {
          if (line.includes(job.name) && line.includes('Set up job')) {
            inJobSection = true;
          }
          if (inJobSection) {
            jobLogs.push(line);
            // Stop when we hit another job
            if (line.includes('Set up job') && !line.includes(job.name)) {
              break;
            }
          }
        }
        
        logs = jobLogs.join('\n');
      }

      // Analyze logs for errors and warnings
      this.analyzeLogContent(logs, job);

    } catch (error) {
      console.error(`   ❌ Error fetching logs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Analyze log content for errors and warnings
   */
  private analyzeLogContent(logs: string, job: JobResult): void {
    const lines = logs.split('\n');

    for (const line of lines) {
      // Detect errors
      if (line.includes('Error:') || line.includes('ERROR') || line.includes('FAILED')) {
        if (!job.errors.includes(line.trim())) {
          job.errors.push(line.trim());
        }
      }

      // Detect warnings
      if (line.includes('Warning:') || line.includes('WARN')) {
        if (!job.warnings.includes(line.trim())) {
          job.warnings.push(line.trim());
        }
      }

      // Detect missing files
      if (line.includes('No files were found') || line.includes('not found')) {
        job.errors.push(`Missing file/artifact: ${line.trim()}`);
      }

      // Detect artifact names
      if (line.includes('artifact') || line.includes('.json')) {
        const artifactMatch = line.match(/[\w-]+\.json/);
        if (artifactMatch && !job.artifacts.includes(artifactMatch[0])) {
          job.artifacts.push(artifactMatch[0]);
        }
      }
    }

    if (job.errors.length > 0) {
      console.log(`   ❌ Found ${job.errors.length} errors`);
      job.errors.slice(0, 3).forEach(err => console.log(`      - ${err.substring(0, 80)}...`));
    }

    if (job.warnings.length > 0) {
      console.log(`   ⚠️  Found ${job.warnings.length} warnings`);
    }
  }

  /**
   * Generate fix commands based on analysis
   */
  private generateFixCommands(jobs: JobResult[]): string[] {
    console.log('\n⚡ Generated Fix Commands:');
    console.log('================================\n');

    const fixes: string[] = [];

    for (const job of jobs) {
      // Handle cache-related errors
      if (job.errors.some(e => e.includes('Cache not found'))) {
        if (!fixes.includes('pnpm ci:clear-cache')) {
          fixes.push('pnpm ci:clear-cache');
          console.log('1. Clear GitHub Actions cache:');
          console.log('   pnpm ci:clear-cache\n');
        }
      }

      // Handle missing artifact errors
      if (job.errors.some(e => e.includes('No files were found'))) {
        if (!fixes.includes('pnpm ci:generate-report')) {
          fixes.push('pnpm ci:generate-report');
          console.log('2. Generate missing CI reports:');
          console.log('   pnpm ci:generate-report\n');
        }
      }

      // Handle path validation errors
      if (job.errors.some(e => e.includes('Path Validation Error'))) {
        if (!fixes.includes('pnpm ci:fix-paths')) {
          fixes.push('pnpm ci:fix-paths');
          console.log('3. Fix file path issues:');
          console.log('   pnpm ci:fix-paths\n');
        }
      }

      // Handle QualityGateService errors
      if (job.errors.some(e => e.includes('QualityGateService'))) {
        if (!fixes.includes('pnpm ci:fix-quality-gates')) {
          fixes.push('pnpm ci:fix-quality-gates');
          console.log('4. Fix Quality Gate Service issues:');
          console.log('   pnpm ci:fix-quality-gates\n');
        }
      }

      // Handle ESLint errors
      if (job.errors.some(e => e.includes('eslint') || e.includes('Unexpected any'))) {
        if (!fixes.includes('pnpm lint:fix')) {
          fixes.push('pnpm lint:fix');
          console.log('5. Fix ESLint errors:');
          console.log('   pnpm lint:fix\n');
        }
      }

      // Handle TypeScript errors
      if (job.errors.some(e => e.includes('typescript') || e.includes('TS'))) {
        if (!fixes.includes('pnpm type-check')) {
          fixes.push('pnpm type-check');
          console.log('6. Fix TypeScript errors:');
          console.log('   pnpm type-check\n');
        }
      }
    }

    return fixes;
  }
}

// CLI Interface
async function main() {
  // Check for no-color flag and remove it from args
  const args = process.argv.slice(2);
  const noColorIndex = args.indexOf('--no-color');
  const noColor = noColorIndex !== -1;
  if (noColor) {
    args.splice(noColorIndex, 1);
    // Disable ANSI colors by overriding console methods
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      const message = args.join(' ').replace(/\x1b\[[0-9;]*m/g, '');
      originalLog(message);
    };
  }
  
  const analyzer = new GitHubWorkflowAnalyzer();
  
  // Get workflow identifier from remaining args
  const identifier = args[0] || 'latest';
  
  await analyzer.analyzeWorkflow(identifier);
}

main().catch(console.error);

export { GitHubWorkflowAnalyzer };
