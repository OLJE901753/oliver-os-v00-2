#!/usr/bin/env node

/**
 * GitHub Actions Monitor and Auto-Fix Script
 * Monitors GitHub Actions workflows and automatically generates fix commands when they fail
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';

class GitHubActionsMonitor {
  private repoOwner = 'OLJE901753';
  private repoName = 'oliver-os-v00-2';
  private branch = 'develop';

  constructor() {
    console.log('🤖 GitHub Actions Monitor & Auto-Fix System');
    console.log('============================================');
    console.log(`📁 Repository: ${this.repoOwner}/${this.repoName}`);
    console.log(`🌿 Branch: ${this.branch}`);
    console.log('');
  }

  /**
   * Monitor GitHub Actions workflows
   */
  async monitorWorkflows(): Promise<void> {
    console.log('🔍 Monitoring GitHub Actions workflows...');
    
    try {
      // Get recent workflow runs
      const workflowRuns = this.getWorkflowRuns();
      
      if (workflowRuns.length === 0) {
        console.log('⚠️  No recent workflow runs found');
        return;
      }

      console.log(`📊 Found ${workflowRuns.length} recent workflow runs`);
      
      // Check for failed workflows
      const failedWorkflows = workflowRuns.filter(run => run.conclusion === 'failure');
      
      if (failedWorkflows.length === 0) {
        console.log('✅ All workflows are passing!');
        return;
      }

      console.log(`🚨 Found ${failedWorkflows.length} failed workflows:`);
      
      // Process each failed workflow
      for (const workflow of failedWorkflows) {
        await this.processFailedWorkflow(workflow);
      }

    } catch (error) {
      console.error('❌ Error monitoring workflows:', error.message);
    }
  }

  /**
   * Get recent workflow runs - fetches actual runs from GitHub
   */
  private getWorkflowRuns(): any[] {
    try {
      // Try to fetch using GitHub CLI
      try {
        execSync('gh --version', { stdio: 'ignore' });
        
        console.log('   📥 Fetching recent workflow runs...');
        
        const command = `gh run list --repo ${this.repoOwner}/${this.repoName} --branch ${this.branch} --limit 5 --json databaseId,name,conclusion,status,createdAt,url`;
        const output = execSync(command, { encoding: 'utf8' });
        
        const runs = JSON.parse(output);
        
        return runs.map((run: any) => ({
          id: run.databaseId.toString(),
          name: run.name,
          conclusion: run.conclusion,
          status: run.status,
          created_at: run.createdAt,
          html_url: run.url
        }));
      } catch (ghError) {
        // If GitHub CLI is not available, use API
        console.log('   ⚠️  GitHub CLI not available, trying GitHub API...');
        return this.fetchWorkflowRunsFromAPI();
      }
    } catch (error) {
      console.log(`   ⚠️  Could not fetch workflow runs: ${error.message}`);
      console.log('   📝 Using mock data for demonstration');
      
      // Fallback to mock data
      return this.getMockWorkflowRuns();
    }
  }

  /**
   * Fetch workflow runs from GitHub API
   */
  private fetchWorkflowRunsFromAPI(): any[] {
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    
    if (!token) {
      console.log('   ⚠️  GitHub token not found. Set GITHUB_TOKEN or GH_TOKEN.');
      return this.getMockWorkflowRuns();
    }

    try {
      const fetch = require('node-fetch').default;
      
      const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/actions/runs?branch=${this.branch}&per_page=5`;
      
      const response = require('child_process').execSync(`curl -s -H "Authorization: Bearer ${token}" "${url}"`, { encoding: 'utf8' });
      const data = JSON.parse(response);
      
      return data.workflow_runs.map((run: any) => ({
        id: run.id.toString(),
        name: run.name,
        conclusion: run.conclusion,
        status: run.status,
        created_at: run.created_at,
        html_url: run.html_url
      }));
    } catch (error) {
      console.log(`   ❌ API fetch failed: ${error.message}`);
      return this.getMockWorkflowRuns();
    }
  }

  /**
   * Get mock workflow runs as fallback
   */
  private getMockWorkflowRuns(): any[] {
    return [
      {
        id: '1234567890',
        name: 'Enhanced Smart Assistance CI/CD Pipeline',
        conclusion: 'failure',
        status: 'completed',
        created_at: new Date().toISOString(),
        html_url: `https://github.com/${this.repoOwner}/${this.repoName}/actions/runs/1234567890`
      },
      {
        id: '1234567891',
        name: 'Docker CI/CD Pipeline',
        conclusion: 'success',
        status: 'completed',
        created_at: new Date().toISOString(),
        html_url: `https://github.com/${this.repoOwner}/${this.repoName}/actions/runs/1234567891`
      }
    ];
  }

  /**
   * Process a failed workflow
   */
  private async processFailedWorkflow(workflow: any): Promise<void> {
    console.log(`\n🔍 Processing failed workflow: ${workflow.name}`);
    console.log(`   ID: ${workflow.id}`);
    console.log(`   URL: ${workflow.html_url}`);
    
    try {
      // Get workflow logs and artifacts
      const logs = await this.getWorkflowLogs(workflow.id);
      const artifacts = await this.getWorkflowArtifacts(workflow.id);
      
      // Analyze the failure
      const failureAnalysis = this.analyzeWorkflowFailure(logs, artifacts);
      
      // Generate quick fix commands
      const quickFixes = this.generateQuickFixes(failureAnalysis);
      
      // Save analysis and fixes
      this.saveAnalysis(workflow, failureAnalysis, quickFixes);
      
      // Display results
      this.displayResults(workflow, failureAnalysis, quickFixes);
      
    } catch (error) {
      console.error(`❌ Error processing workflow ${workflow.id}:`, error.message);
    }
  }

  /**
   * Get workflow logs - fetches actual logs from GitHub
   */
  private async getWorkflowLogs(workflowId: string): Promise<string> {
    try {
      // Check if GitHub CLI is available
      try {
        execSync('gh --version', { stdio: 'ignore' });
        
        // Fetch actual logs using GitHub CLI
        console.log('   📥 Fetching workflow logs from GitHub...');
        
        const command = `gh run view ${workflowId} --repo ${this.repoOwner}/${this.repoName} --log`;
        const logs = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        
        return logs;
      } catch (ghError) {
        // If GitHub CLI is not available, try to fetch from GitHub API
        console.log('   ⚠️  GitHub CLI not available, trying GitHub API...');
        return await this.fetchLogsFromAPI(workflowId);
      }
    } catch (error) {
      console.log(`   ⚠️  Could not fetch logs: ${error.message}`);
      console.log('   📝 Using mock data for demonstration');
      
      // Fallback to mock data
      return this.getMockLogs();
    }
  }

  /**
   * Fetch logs from GitHub API
   */
  private async fetchLogsFromAPI(workflowId: string): Promise<string> {
    // Check for GitHub token
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    
    if (!token) {
      throw new Error('GitHub token not found. Set GITHUB_TOKEN or GH_TOKEN environment variable.');
    }

    const fetch = (await import('node-fetch')).default;
    
    // Fetch workflow run
    const runUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/actions/runs/${workflowId}`;
    const runResponse = await fetch(runUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!runResponse.ok) {
      throw new Error(`Failed to fetch workflow run: ${runResponse.statusText}`);
    }
    
    const run = await runResponse.json() as { jobs_url: string };
    
    // Fetch jobs for this run
    const jobsUrl = run.jobs_url;
    const jobsResponse = await fetch(jobsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!jobsResponse.ok) {
      throw new Error(`Failed to fetch jobs: ${jobsResponse.statusText}`);
    }
    
    const jobsData = await jobsResponse.json() as { jobs?: Array<{ name: string; conclusion: string; logs_url: string }> };
    const jobs = jobsData.jobs || [];
    
    // Fetch logs for each job
    let allLogs = '';
    
    for (const job of jobs) {
      if (job.conclusion === 'failure') {
        allLogs += `\n=== ${job.name} ===\n`;
        
        // Fetch logs for this job
        try {
          const logsUrl = job.logs_url;
          const logsResponse = await fetch(logsUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json'
            },
            redirect: 'follow'
          });
          
          if (logsResponse.ok) {
            const logs = await logsResponse.text();
            allLogs += logs + '\n';
          }
        } catch (logError) {
          allLogs += `Could not fetch logs for ${job.name}\n`;
        }
      }
    }
    
    return allLogs || this.getMockLogs();
  }

  /**
   * Get mock logs as fallback
   */
  private getMockLogs(): string {
    return `
Smart Assistance Tests - FAILED
================================
Test Suite: algorithms
Status: FAILED
Duration: 2.5s

Test Results:
❌ should analyze code patterns - TypeError: Cannot read property 'name' of undefined
❌ should handle large datasets - Timeout: Async callback was not invoked within 5000ms timeout
✅ should calculate quality score - PASSED

Coverage Tests - FAILED
=======================
Coverage: 65% (threshold: 80%)
Branches: 70% (threshold: 80%)
Functions: 60% (threshold: 80%)

Quality Gates - FAILED
=====================
Quality Score: 75 (threshold: 80)
Complexity: 12 (threshold: 10)
Maintainability: 0.7 (threshold: 0.8)

Build Tests - FAILED
===================
TypeScript compilation errors:
error TS2304: Cannot find name 'testVariable'
error TS2322: Type 'string' is not assignable to type 'number'
    `;
  }

  /**
   * Get workflow artifacts (mock implementation)
   */
  private async getWorkflowArtifacts(workflowId: string): Promise<any[]> {
    // In a real implementation, this would fetch actual artifacts from GitHub API
    return [
      {
        name: 'test-results',
        url: `https://github.com/${this.repoOwner}/${this.repoName}/actions/runs/${workflowId}/artifacts/test-results`
      },
      {
        name: 'coverage-results',
        url: `https://github.com/${this.repoOwner}/${this.repoName}/actions/runs/${workflowId}/artifacts/coverage-results`
      }
    ];
  }

  /**
   * Analyze workflow failure
   */
  private analyzeWorkflowFailure(logs: string, artifacts: any[]): any {
    const analysis: {
      workflowId: string;
      timestamp: string;
      failures: Array<{
        type: string;
        description: string;
        severity: string;
        category: string;
        quickFix: string;
        suggestions: string[];
      }>;
      categories: {
        test: number;
        coverage: number;
        quality: number;
        build: number;
        security: number;
      };
      severity: string;
    } = {
      workflowId: '1234567890',
      timestamp: new Date().toISOString(),
      failures: [],
      categories: {
        test: 0,
        coverage: 0,
        quality: 0,
        build: 0,
        security: 0
      },
      severity: 'medium'
    };

    // Analyze GitHub Actions deprecation errors
    if (logs.includes('deprecated version') || logs.includes('actions/upload-artifact@v3') || logs.includes('actions/download-artifact@v3')) {
      analysis.failures.push({
        type: 'GitHub Actions Deprecated',
        description: 'Using deprecated GitHub Actions version',
        severity: 'high',
        category: 'workflow',
        quickFix: 'sed -i \'s/actions\\/upload-artifact@v3/actions\\/upload-artifact@v4/g\' .github/workflows/*.yml && sed -i \'s/actions\\/download-artifact@v3/actions\\/download-artifact@v4/g\' .github/workflows/*.yml',
        suggestions: [
          'Update deprecated GitHub Actions to latest version',
          'Check GitHub Actions marketplace for current versions',
          'Test workflow after updating actions'
        ]
      });
      analysis.categories.build++;
    }

    // Analyze test failures
    if (logs.includes('TypeError: Cannot read property')) {
      analysis.failures.push({
        type: 'TypeScript Error',
        description: 'TypeError: Cannot read property of undefined',
        severity: 'high',
        category: 'test',
        quickFix: 'pnpm type-check && pnpm lint:fix',
        suggestions: [
          'Check for undefined variables',
          'Verify object property access',
          'Add null checks'
        ]
      });
      analysis.categories.test++;
    }

    if (logs.includes('Timeout: Async callback')) {
      analysis.failures.push({
        type: 'Test Timeout',
        description: 'Test timed out - Async callback was not invoked',
        severity: 'medium',
        category: 'test',
        quickFix: 'pnpm test:smart --timeout=60000',
        suggestions: [
          'Increase test timeout',
          'Check for infinite loops',
          'Optimize async operations'
        ]
      });
      analysis.categories.test++;
    }

    // Analyze coverage failures
    if (logs.includes('Coverage: 65%')) {
      analysis.failures.push({
        type: 'Low Coverage',
        description: 'Test coverage below threshold (65% < 80%)',
        severity: 'medium',
        category: 'coverage',
        quickFix: 'pnpm test:smart:coverage',
        suggestions: [
          'Add missing test cases',
          'Improve existing tests',
          'Remove unused code'
        ]
      });
      analysis.categories.coverage++;
    }

    // Analyze quality failures
    if (logs.includes('Quality Score: 75')) {
      analysis.failures.push({
        type: 'Low Quality Score',
        description: 'Quality score below threshold (75 < 80)',
        severity: 'medium',
        category: 'quality',
        quickFix: 'pnpm lint:fix && pnpm type-check',
        suggestions: [
          'Improve code quality',
          'Reduce complexity',
          'Add documentation'
        ]
      });
      analysis.categories.quality++;
    }

    // Analyze build failures
    if (logs.includes('error TS2304') || logs.includes('error TS2322')) {
      analysis.failures.push({
        type: 'TypeScript Build Error',
        description: 'TypeScript compilation errors detected',
        severity: 'high',
        category: 'build',
        quickFix: 'pnpm type-check',
        suggestions: [
          'Fix TypeScript errors',
          'Check type definitions',
          'Update imports'
        ]
      });
      analysis.categories.build++;
    }

    // Determine overall severity
    const highSeverityCount = analysis.failures.filter(f => f.severity === 'high').length;
    if (highSeverityCount > 0) {
      analysis.severity = 'high';
    }

    return analysis;
  }

  /**
   * Generate quick fix commands
   */
  private generateQuickFixes(analysis: any): any[] {
    const quickFixes: Array<{
      command: string;
      description: string;
      category: string;
      severity: string;
      autoFixable: boolean;
      confidence: number;
    }> = [];

    // Generate fixes based on failure categories
    if (analysis.categories.test > 0) {
      quickFixes.push({
        command: 'pnpm test:smart --timeout=60000 --reporter=verbose',
        description: 'Fix test failures with increased timeout',
        category: 'test',
        severity: 'medium',
        autoFixable: true,
        confidence: 0.8
      });
    }

    if (analysis.categories.coverage > 0) {
      quickFixes.push({
        command: 'pnpm test:smart:coverage',
        description: 'Generate coverage report and identify gaps',
        category: 'coverage',
        severity: 'medium',
        autoFixable: false,
        confidence: 0.7
      });
    }

    if (analysis.categories.quality > 0) {
      quickFixes.push({
        command: 'pnpm lint:fix && pnpm type-check',
        description: 'Fix linting and type issues automatically',
        category: 'quality',
        severity: 'medium',
        autoFixable: true,
        confidence: 0.9
      });
    }

    if (analysis.categories.build > 0) {
      quickFixes.push({
        command: 'pnpm type-check && pnpm build',
        description: 'Fix TypeScript errors and rebuild',
        category: 'build',
        severity: 'high',
        autoFixable: false,
        confidence: 0.8
      });
    }

    // Add comprehensive fix
    quickFixes.push({
      command: 'pnpm ci:enhanced',
      description: 'Run enhanced CI pipeline with all fixes',
      category: 'comprehensive',
      severity: 'medium',
      autoFixable: true,
      confidence: 0.7
    });

    return quickFixes;
  }

  /**
   * Save analysis and fixes
   */
  private saveAnalysis(workflow: any, analysis: any, quickFixes: any[]): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save failure analysis
    const failureAnalysisFile = `github-workflow-failure-${timestamp}.json`;
    writeFileSync(failureAnalysisFile, JSON.stringify({
      workflow,
      analysis,
      timestamp: new Date().toISOString()
    }, null, 2));

    // Save quick fixes
    const quickFixesFile = `github-workflow-fixes-${timestamp}.json`;
    writeFileSync(quickFixesFile, JSON.stringify({
      workflow,
      quickFixes,
      timestamp: new Date().toISOString()
    }, null, 2));

    console.log(`💾 Saved analysis: ${failureAnalysisFile}`);
    console.log(`💾 Saved fixes: ${quickFixesFile}`);
  }

  /**
   * Display results
   */
  private displayResults(workflow: any, analysis: any, quickFixes: any[]): void {
    console.log(`\n📊 Analysis Results for ${workflow.name}:`);
    console.log(`   Severity: ${analysis.severity.toUpperCase()}`);
    console.log(`   Total Failures: ${analysis.failures.length}`);
    console.log(`   Categories: ${Object.entries(analysis.categories).map(([k, v]) => `${k}:${v}`).join(', ')}`);
    
    console.log(`\n🚨 Detected Failures:`);
    analysis.failures.forEach((failure, index) => {
      console.log(`   ${index + 1}. ${failure.type} (${failure.severity})`);
      console.log(`      ${failure.description}`);
      console.log(`      Quick Fix: ${failure.quickFix}`);
    });

    console.log(`\n⚡ Quick Fix Commands:`);
    quickFixes.forEach((fix, index) => {
      console.log(`   ${index + 1}. ${fix.command}`);
      console.log(`      ${fix.description} (${fix.autoFixable ? 'Auto-fixable' : 'Manual'})`);
    });

    console.log(`\n🎯 Recommended Actions:`);
    console.log(`   1. Review the failure analysis`);
    console.log(`   2. Run auto-fixable commands first`);
    console.log(`   3. Address manual fixes as needed`);
    console.log(`   4. Re-run the workflow to verify fixes`);
  }

  /**
   * Run the monitor
   */
  async run(): Promise<void> {
    try {
      await this.monitorWorkflows();
      
      console.log('\n✅ GitHub Actions monitoring completed!');
      console.log('\n📋 Next Steps:');
      console.log('   1. Check GitHub Actions tab for workflow status');
      console.log('   2. Review generated analysis files');
      console.log('   3. Run suggested quick fix commands');
      console.log('   4. Push fixes to trigger new workflow runs');
      
    } catch (error) {
      console.error('❌ Monitoring failed:', error);
      process.exit(1);
    }
  }
}

// CLI Interface
async function main() {
  const monitor = new GitHubActionsMonitor();
  await monitor.run();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { GitHubActionsMonitor };
