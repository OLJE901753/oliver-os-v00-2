#!/usr/bin/env node

/**
 * Cursor CI Sync Script
 * Syncs GitHub Actions CI/CD results to Cursor memory for learning
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface WorkflowRun {
  id: string;
  name: string;
  conclusion: 'success' | 'failure' | 'cancelled' | 'neutral' | 'skipped';
  status: 'completed' | 'in_progress' | 'queued';
  created_at: string;
  html_url: string;
  head_branch: string;
  head_sha: string;
}

interface CIFailure {
  pattern: string;
  workflow: string;
  conclusion: string;
  branch: string;
  commit: string;
  timestamp: string;
  jobs: string[];
  errorType: string;
  errorMessage: string;
  files: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface CIMemory {
  recentRuns: WorkflowRun[];
  failurePatterns: CIFailure[];
  successPatterns: string[];
  failureHistory: {
    [pattern: string]: {
      count: number;
      lastOccurrence: string;
      branches: string[];
      commits: string[];
      averageTimeToFix: number; // minutes
    };
  };
}

class CursorCISync {
  private repoOwner = 'OLJE901753';
  private repoName = 'oliver-os-v00-2';
  private branch = 'develop';
  private memoryPath = join(__dirname, '..', 'cursor-memory.json');

  constructor() {
    console.log('🔄 Cursor CI/CD Sync System');
    console.log('================================');
    console.log(`📁 Repository: ${this.repoOwner}/${this.repoName}`);
    console.log(`🌿 Branch: ${this.branch}`);
    console.log('');
  }

  /**
   * Sync CI/CD results from GitHub Actions
   */
  async sync(): Promise<void> {
    console.log('🔍 Syncing CI/CD results...');

    try {
      // Fetch recent workflow runs
      const workflowRuns = await this.fetchWorkflowRuns();

      if (workflowRuns.length === 0) {
        console.log('⚠️  No recent workflow runs found');
        return;
      }

      console.log(`📊 Found ${workflowRuns.length} recent workflow runs`);

      // Load existing memory
      const memory = this.loadMemory();

      // Process runs
      const newFailures: CIFailure[] = [];
      const newSuccesses: WorkflowRun[] = [];

      for (const run of workflowRuns) {
        if (run.conclusion === 'failure') {
          const failure = await this.analyzeFailure(run);
          newFailures.push(failure);
        } else if (run.conclusion === 'success') {
          newSuccesses.push(run);
        }
      }

      // Update memory
      this.updateMemory(memory, workflowRuns, newFailures, newSuccesses);

      // Save memory
      this.saveMemory(memory);

      console.log(`✅ Synced ${newFailures.length} failures and ${newSuccesses.length} successes`);
      console.log(`📝 Updated CI patterns in memory`);

      // Generate summary
      this.printSummary(memory);

    } catch (error) {
      console.error('❌ Error syncing CI results:', error);
      throw error;
    }
  }

  /**
   * Fetch workflow runs from GitHub
   */
  private async fetchWorkflowRuns(): Promise<WorkflowRun[]> {
    try {
      // Try GitHub CLI first
      const command = `gh run list --repo ${this.repoOwner}/${this.repoName} --branch ${this.branch} --limit 20 --json databaseId,name,conclusion,status,createdAt,url,headBranch,headSha`;
      const output = execSync(command, { encoding: 'utf8' });
      const runs = JSON.parse(output);

      return runs.map((run: any) => ({
        id: run.databaseId.toString(),
        name: run.name,
        conclusion: run.conclusion || 'unknown',
        status: run.status,
        created_at: run.createdAt,
        html_url: run.url,
        head_branch: run.headBranch,
        head_sha: run.headSha
      }));

    } catch (error) {
      console.log('⚠️  GitHub CLI not available, using API...');
      return this.fetchWorkflowRunsFromAPI();
    }
  }

  /**
   * Fetch from GitHub API
   */
  private async fetchWorkflowRunsFromAPI(): Promise<WorkflowRun[]> {
    // Fallback implementation
    console.log('   Using GitHub API...');
    return [];
  }

  /**
   * Analyze a failed workflow run
   */
  private async analyzeFailure(run: WorkflowRun): Promise<CIFailure> {
    console.log(`   Analyzing failure: ${run.name}`);

    // Try to get detailed failure info
    let errorMessage = `Workflow "${run.name}" failed`;
    let errorType = 'unknown';
    let jobs: string[] = [];
    let files: string[] = [];

    try {
      const command = `gh run view ${run.id} --repo ${this.repoOwner}/${this.repoName} --json jobs,headSha`;
      const output = execSync(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
      const runData = JSON.parse(output);

      // Analyze jobs
      if (runData.jobs) {
        jobs = runData.jobs.map((job: any) => job.name);

        // Try to get failure details from logs
        for (const job of runData.jobs) {
          if (job.conclusion === 'failure') {
            try {
              const logs = execSync(`gh run view ${run.id} --repo ${this.repoOwner}/${this.repoName} --log-failed`, {
                encoding: 'utf8',
                maxBuffer: 1024 * 1024
              });
              errorMessage = this.extractErrorMessage(logs);
              errorType = this.categorizeError(errorMessage);
            } catch (e) {
              // Logs might not be available
            }
          }
        }
      }
    } catch (error) {
      // Fallback to basic info
    }

    // Extract pattern
    const pattern = this.extractPattern(errorMessage, run.name);

    return {
      pattern,
      workflow: run.name,
      conclusion: run.conclusion,
      branch: run.head_branch,
      commit: run.head_sha,
      timestamp: run.created_at,
      jobs,
      errorType,
      errorMessage,
      files,
      severity: this.calculateSeverity(errorType, jobs.length)
    };
  }

  /**
   * Extract error message from logs
   */
  private extractErrorMessage(logs: string): string {
    // Look for common error patterns
    const patterns = [
      /Error: (.*)/,
      /FAILED: (.*)/,
      /✖ .*: (.*)/,
      /TypeError: (.*)/,
      /SyntaxError: (.*)/
    ];

    for (const pattern of patterns) {
      const match = logs.match(pattern);
      if (match) return match[1];
    }

    return 'Unknown error';
  }

  /**
   * Categorize error type
   */
  private categorizeError(errorMessage: string): string {
    if (/test|spec/i.test(errorMessage)) return 'test-failure';
    if (/build|compile/i.test(errorMessage)) return 'build-failure';
    if (/docker|container/i.test(errorMessage)) return 'docker-failure';
    if (/security|vulnerability/i.test(errorMessage)) return 'security-failure';
    if (/lint|eslint/i.test(errorMessage)) return 'lint-failure';
    if (/type|typescript/i.test(errorMessage)) return 'type-failure';
    if (/timeout/i.test(errorMessage)) return 'timeout';
    return 'unknown';
  }

  /**
   * Extract failure pattern
   */
  private extractPattern(errorMessage: string, workflow: string): string {
    // Create a pattern based on workflow name and error category
    const category = this.categorizeError(errorMessage);
    return `${workflow}-${category}`;
  }

  /**
   * Calculate severity
   */
  private calculateSeverity(errorType: string, failedJobs: number): 'low' | 'medium' | 'high' | 'critical' {
    if (errorType === 'security-failure') return 'critical';
    if (errorType === 'build-failure') return 'high';
    if (errorType === 'test-failure') return failedJobs > 3 ? 'high' : 'medium';
    return 'low';
  }

  /**
   * Update memory with new results
   */
  private updateMemory(
    memory: any,
    runs: WorkflowRun[],
    failures: CIFailure[],
    successes: WorkflowRun[]
  ): void {
    // Extend memory with CI data
    if (!memory.ci) {
      memory.ci = {
        recentRuns: [],
        failurePatterns: [],
        successPatterns: [],
        failureHistory: {},
        lastSync: new Date().toISOString()
      };
    }

    // Add recent runs
    memory.ci.recentRuns = runs.slice(0, 20);

    // Add new failures
    for (const failure of failures) {
      // Check if pattern exists in history
      if (!memory.ci.failureHistory[failure.pattern]) {
        memory.ci.failureHistory[failure.pattern] = {
          count: 0,
          lastOccurrence: failure.timestamp,
          branches: [],
          commits: [],
          averageTimeToFix: 0
        };
      }

      // Update pattern history
      const pattern = memory.ci.failureHistory[failure.pattern];
      pattern.count++;
      pattern.lastOccurrence = failure.timestamp;
      if (!pattern.branches.includes(failure.branch)) {
        pattern.branches.push(failure.branch);
      }
      if (!pattern.commits.includes(failure.commit)) {
        pattern.commits.push(failure.commit);
      }

      // Store failure pattern
      memory.ci.failurePatterns.unshift(failure);
    }

    // Keep only last 50 failures
    memory.ci.failurePatterns = memory.ci.failurePatterns.slice(0, 50);

    // Update last sync timestamp
    memory.ci.lastSync = new Date().toISOString();
  }

  /**
   * Load memory
   */
  private loadMemory(): any {
    if (!existsSync(this.memoryPath)) {
      return { ci: {} };
    }

    try {
      const content = readFileSync(this.memoryPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('⚠️  Error loading memory:', error);
      return { ci: {} };
    }
  }

  /**
   * Save memory
   */
  private saveMemory(memory: any): void {
    try {
      writeFileSync(this.memoryPath, JSON.stringify(memory, null, 2), 'utf8');
      console.log('💾 Saved CI memory');
    } catch (error) {
      console.error('❌ Error saving memory:', error);
    }
  }

  /**
   * Print summary
   */
  private printSummary(memory: any): void {
    if (!memory.ci) return;

    console.log('');
    console.log('📊 CI/CD Summary:');
    console.log(`   Recent runs: ${memory.ci.recentRuns?.length || 0}`);
    console.log(`   Failure patterns: ${Object.keys(memory.ci.failureHistory || {}).length}`);

    // Show top failure patterns
    if (memory.ci.failureHistory) {
      const topPatterns = Object.entries(memory.ci.failureHistory)
        .sort((a: any, b: any) => b[1].count - a[1].count)
        .slice(0, 5);

      if (topPatterns.length > 0) {
        console.log('');
        console.log('🔴 Top Failure Patterns:');
        for (const [pattern, data] of topPatterns as any[]) {
          console.log(`   ${pattern}: ${data.count} occurrences (${data.branches.length} branches)`);
        }
      }
    }
  }
}

// Run sync if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('cursor-ci-sync.ts');

if (isMainModule) {
  const sync = new CursorCISync();
  sync.sync().then(() => {
    console.log('✅ CI/CD sync complete');
  }).catch((error) => {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  });
}

export { CursorCISync };

