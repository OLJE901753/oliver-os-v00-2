#!/usr/bin/env tsx

/**
 * Trigger Workflow Script
 * Commits local changes and pushes to GitHub to trigger CI/CD workflows
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

class WorkflowTrigger {
  private commitMessage: string;
  private branch: string;

  constructor() {
    this.commitMessage = process.argv[2] || this.generateDefaultMessage();
    this.branch = this.getCurrentBranch();
  }

  private generateDefaultMessage(): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `fix: Update CI/CD workflow and trigger test - ${timestamp}`;
  }

  private getCurrentBranch(): string {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch (error) {
      console.error('❌ Could not determine current branch');
      process.exit(1);
    }
  }

  private checkGitStatus(): boolean {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      return status.trim().length > 0;
    } catch (error) {
      console.error('❌ Could not check git status');
      return false;
    }
  }

  private addChanges(): void {
    console.log('📁 Adding all changes to git...');
    try {
      execSync('git add .', { stdio: 'inherit' });
      console.log('✅ Changes added successfully');
    } catch (error) {
      console.error('❌ Failed to add changes:', error);
      process.exit(1);
    }
  }

  private commitChanges(): void {
    console.log(`💾 Committing changes: "${this.commitMessage}"`);
    try {
      execSync(`git commit -m "${this.commitMessage}"`, { stdio: 'inherit' });
      console.log('✅ Changes committed successfully');
    } catch (error) {
      console.error('❌ Failed to commit changes:', error);
      process.exit(1);
    }
  }

  private pushChanges(): void {
    console.log(`🚀 Pushing to ${this.branch}...`);
    try {
      execSync(`git push origin ${this.branch}`, { stdio: 'inherit' });
      console.log('✅ Changes pushed successfully');
    } catch (error) {
      console.error('❌ Failed to push changes:', error);
      process.exit(1);
    }
  }

  private getLatestCommitHash(): string {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().substring(0, 7);
    } catch (error) {
      console.error('❌ Could not get commit hash');
      return 'unknown';
    }
  }

  async trigger(): Promise<void> {
    console.log('🚀 Triggering GitHub Actions Workflow');
    console.log('=====================================');
    console.log(`📝 Commit message: ${this.commitMessage}`);
    console.log(`🌿 Branch: ${this.branch}`);
    console.log('');

    // Check if there are changes to commit
    if (!this.checkGitStatus()) {
      console.log('⚠️  No changes detected. Creating a small change to trigger workflow...');
      // Create a small change to trigger the workflow
      const triggerFile = 'workflow-trigger.txt';
      const timestamp = new Date().toISOString();
      execSync(`echo "Workflow triggered at: ${timestamp}" > ${triggerFile}`);
    }

    // Add, commit, and push changes
    this.addChanges();
    this.commitChanges();
    this.pushChanges();

    const commitHash = this.getLatestCommitHash();
    
    console.log('');
    console.log('🎉 Workflow Triggered Successfully!');
    console.log('==================================');
    console.log(`📊 Commit Hash: ${commitHash}`);
    console.log(`🔗 GitHub Actions: https://github.com/OLJE901753/oliver-os-v00-2/actions`);
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Wait 1-2 minutes for workflow to start');
    console.log(`   2. Run: pnpm ci:analyze-workflow ${commitHash}`);
    console.log('   3. Check GitHub Actions for real-time status');
    console.log('');
    console.log('✨ Your CI/CD workflow is now running on GitHub!');
  }
}

// CLI Interface
async function main() {
  const trigger = new WorkflowTrigger();
  await trigger.trigger();
}

main().catch(console.error);

export { WorkflowTrigger };
