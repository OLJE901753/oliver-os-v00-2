/**
 * Branch Management Service
 * Clean solo development workflow management
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';

const execAsync = promisify(exec);

export interface BranchInfo {
  name: string;
  current: boolean;
  lastCommit: string;
  lastCommitDate: string;
  ahead: number;
  behind: number;
  status: 'clean' | 'dirty' | 'conflict';
  changes: string[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  command: string;
  required: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: string;
  error?: string;
  duration?: number;
}

export interface SoloWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  duration?: number;
  branchName?: string;
  changes?: string[];
}

export interface WorkflowConfig {
  enabled: boolean;
  autoCreateBranch: boolean;
  branchPrefix: string;
  workflows: {
    feature: SoloWorkflow;
    bugfix: SoloWorkflow;
    refactor: SoloWorkflow;
    hotfix: SoloWorkflow;
  };
  qualityGates: {
    preCommit: boolean;
    preMerge: boolean;
    prePush: boolean;
  };
  automation: {
    autoCommit: boolean;
    autoPush: boolean;
    autoCleanup: boolean;
  };
}

export class BranchManagementService extends EventEmitter {
  private _logger: Logger;
  private workflowConfig!: WorkflowConfig;
  private workflowHistory: Map<string, SoloWorkflow>;

  constructor(_config: Config) {
    super();
    this._logger = new Logger('BranchManagementService');
    this.workflowHistory = new Map();
    this.loadWorkflowConfig();
  }

  /**
   * Initialize branch management service
   */
  async initialize(): Promise<void> {
    this._logger.info('🌿 Initializing Branch Management Service...');
    
    try {
      await this.loadWorkflowConfig();
      await this.validateGitRepository();
      await this.loadWorkflowHistory();
      
      this._logger.info('✅ Branch Management Service initialized successfully');
      this.emit('branch-management:initialized');
    } catch (error) {
      this._logger.error('Failed to initialize branch management service:', error);
      throw error;
    }
  }

  /**
   * Load workflow configuration
   */
  private async loadWorkflowConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'branch-management-config.json');
      if (await fs.pathExists(configPath)) {
        this.workflowConfig = await fs.readJson(configPath);
        this._logger.info('📋 Branch management configuration loaded');
      } else {
        this.workflowConfig = this.getDefaultWorkflowConfig();
        await this.saveWorkflowConfig();
        this._logger.info('📋 Using default branch management configuration');
      }
    } catch (error) {
      this._logger.warn('Failed to load branch management configuration, using defaults');
      this.workflowConfig = this.getDefaultWorkflowConfig();
    }
  }

  /**
   * Get default workflow configuration
   */
  private getDefaultWorkflowConfig(): WorkflowConfig {
    return {
      enabled: true,
      autoCreateBranch: true,
      branchPrefix: 'feature/',
      workflows: {
        feature: {
          id: 'feature-workflow',
          name: 'Feature Development Workflow',
          description: 'Complete workflow for developing new features',
          steps: [
            {
              id: 'create-branch',
              name: 'Create Feature Branch',
              description: 'Create a new branch for the feature',
              command: 'git checkout -b feature/{feature-name}',
              required: true,
              status: 'pending'
            },
            {
              id: 'quality-check',
              name: 'Quality Check',
              description: 'Run quality checks before development',
              command: 'pnpm review:quality',
              required: true,
              status: 'pending'
            },
            {
              id: 'development',
              name: 'Development',
              description: 'Develop the feature',
              command: 'echo "Develop feature"',
              required: true,
              status: 'pending'
            },
            {
              id: 'self-review',
              name: 'Self Review',
              description: 'Review your own changes',
              command: 'pnpm review:self',
              required: true,
              status: 'pending'
            },
            {
              id: 'quality-gate',
              name: 'Quality Gate',
              description: 'Run quality gate checks',
              command: 'pnpm review:check',
              required: true,
              status: 'pending'
            },
            {
              id: 'merge',
              name: 'Merge to Main',
              description: 'Merge feature branch to main',
              command: 'git checkout main && git merge feature/{feature-name}',
              required: true,
              status: 'pending'
            },
            {
              id: 'cleanup',
              name: 'Cleanup',
              description: 'Clean up feature branch',
              command: 'git branch -d feature/{feature-name}',
              required: false,
              status: 'pending'
            }
          ],
          status: 'pending'
        },
        bugfix: {
          id: 'bugfix-workflow',
          name: 'Bug Fix Workflow',
          description: 'Complete workflow for fixing bugs',
          steps: [
            {
              id: 'create-branch',
              name: 'Create Bugfix Branch',
              description: 'Create a new branch for the bug fix',
              command: 'git checkout -b bugfix/{bug-name}',
              required: true,
              status: 'pending'
            },
            {
              id: 'identify-bug',
              name: 'Identify Bug',
              description: 'Identify and understand the bug',
              command: 'echo "Identify bug"',
              required: true,
              status: 'pending'
            },
            {
              id: 'fix-bug',
              name: 'Fix Bug',
              description: 'Fix the identified bug',
              command: 'echo "Fix bug"',
              required: true,
              status: 'pending'
            },
            {
              id: 'test-fix',
              name: 'Test Fix',
              description: 'Test the bug fix',
              command: 'pnpm test',
              required: true,
              status: 'pending'
            },
            {
              id: 'self-review',
              name: 'Self Review',
              description: 'Review your bug fix',
              command: 'pnpm review:self',
              required: true,
              status: 'pending'
            },
            {
              id: 'merge',
              name: 'Merge to Main',
              description: 'Merge bugfix branch to main',
              command: 'git checkout main && git merge bugfix/{bug-name}',
              required: true,
              status: 'pending'
            },
            {
              id: 'cleanup',
              name: 'Cleanup',
              description: 'Clean up bugfix branch',
              command: 'git branch -d bugfix/{bug-name}',
              required: false,
              status: 'pending'
            }
          ],
          status: 'pending'
        },
        refactor: {
          id: 'refactor-workflow',
          name: 'Refactor Workflow',
          description: 'Complete workflow for code refactoring',
          steps: [
            {
              id: 'create-branch',
              name: 'Create Refactor Branch',
              description: 'Create a new branch for refactoring',
              command: 'git checkout -b refactor/{refactor-name}',
              required: true,
              status: 'pending'
            },
            {
              id: 'analyze-code',
              name: 'Analyze Code',
              description: 'Analyze code to be refactored',
              command: 'pnpm review:suggest',
              required: true,
              status: 'pending'
            },
            {
              id: 'refactor',
              name: 'Refactor Code',
              description: 'Refactor the code',
              command: 'echo "Refactor code"',
              required: true,
              status: 'pending'
            },
            {
              id: 'test-refactor',
              name: 'Test Refactor',
              description: 'Test the refactored code',
              command: 'pnpm test',
              required: true,
              status: 'pending'
            },
            {
              id: 'self-review',
              name: 'Self Review',
              description: 'Review your refactoring',
              command: 'pnpm review:self',
              required: true,
              status: 'pending'
            },
            {
              id: 'merge',
              name: 'Merge to Main',
              description: 'Merge refactor branch to main',
              command: 'git checkout main && git merge refactor/{refactor-name}',
              required: true,
              status: 'pending'
            },
            {
              id: 'cleanup',
              name: 'Cleanup',
              description: 'Clean up refactor branch',
              command: 'git branch -d refactor/{refactor-name}',
              required: false,
              status: 'pending'
            }
          ],
          status: 'pending'
        },
        hotfix: {
          id: 'hotfix-workflow',
          name: 'Hotfix Workflow',
          description: 'Complete workflow for urgent fixes',
          steps: [
            {
              id: 'create-branch',
              name: 'Create Hotfix Branch',
              description: 'Create a new branch for the hotfix',
              command: 'git checkout -b hotfix/{hotfix-name}',
              required: true,
              status: 'pending'
            },
            {
              id: 'fix-issue',
              name: 'Fix Issue',
              description: 'Fix the urgent issue',
              command: 'echo "Fix urgent issue"',
              required: true,
              status: 'pending'
            },
            {
              id: 'test-fix',
              name: 'Test Fix',
              description: 'Test the hotfix',
              command: 'pnpm test',
              required: true,
              status: 'pending'
            },
            {
              id: 'merge',
              name: 'Merge to Main',
              description: 'Merge hotfix branch to main',
              command: 'git checkout main && git merge hotfix/{hotfix-name}',
              required: true,
              status: 'pending'
            },
            {
              id: 'cleanup',
              name: 'Cleanup',
              description: 'Clean up hotfix branch',
              command: 'git branch -d hotfix/{hotfix-name}',
              required: false,
              status: 'pending'
            }
          ],
          status: 'pending'
        }
      },
      qualityGates: {
        preCommit: true,
        preMerge: true,
        prePush: true
      },
      automation: {
        autoCommit: false,
        autoPush: false,
        autoCleanup: true
      }
    };
  }

  /**
   * Save workflow configuration
   */
  private async saveWorkflowConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'branch-management-config.json');
      await fs.writeJson(configPath, this.workflowConfig, { spaces: 2 });
      this._logger.info('💾 Branch management configuration saved');
    } catch (error) {
      this._logger.error('Failed to save branch management configuration:', error);
    }
  }

  /**
   * Validate git repository
   */
  private async validateGitRepository(): Promise<void> {
    try {
      await execAsync('git status');
      this._logger.info('✅ Git repository validated');
    } catch (error) {
      this._logger.warn('Not in a git repository - some features may not work');
    }
  }

  /**
   * Load workflow history
   */
  private async loadWorkflowHistory(): Promise<void> {
    try {
      const historyPath = path.join(process.cwd(), 'workflow-history.json');
      if (await fs.pathExists(historyPath)) {
        const history = await fs.readJson(historyPath);
        this.workflowHistory = new Map(history);
        this._logger.info('📚 Workflow history loaded');
      }
    } catch (error) {
      this._logger.warn('Failed to load workflow history');
    }
  }

  /**
   * Get current branch information
   */
  async getCurrentBranchInfo(): Promise<BranchInfo> {
    try {
      const { stdout: branchName } = await execAsync('git branch --show-current');
      const { stdout: status } = await execAsync('git status --porcelain');
      const { stdout: log } = await execAsync('git log -1 --format="%H %cd" --date=short');
      
      const logParts = log.trim().split(' ');
      const commitHash = logParts[0]! || '';
      const commitDate = logParts[1]! || '';
      const changes = status.split('\n').filter(line => line.trim());
      
      return {
        name: branchName.trim(),
        current: true,
        lastCommit: commitHash,
        lastCommitDate: commitDate,
        ahead: 0, // Simplified
        behind: 0, // Simplified
        status: changes.length > 0 ? 'dirty' : 'clean',
        changes
      };
    } catch (error) {
      this._logger.error('Failed to get current branch info:', error);
      throw error;
    }
  }

  /**
   * Get all branches information
   */
  async getAllBranchesInfo(): Promise<BranchInfo[]> {
    try {
      const { stdout } = await execAsync('git branch -a --format="%(refname:short) %(objectname) %(committerdate:short)"');
      const branches: BranchInfo[] = [];
      
      const lines = stdout.split('\n').filter(line => line.trim());
      for (const line of lines) {
        const lineParts = line.trim().split(' ');
        const name = lineParts[0]! || '';
        const commitHash = lineParts[1]! || '';
        const commitDate = lineParts[2]! || '';
        const { stdout: status } = await execAsync(`git status --porcelain`);
        const changes = status.split('\n').filter(line => line.trim());
        
        branches.push({
          name,
          current: false, // Simplified
          lastCommit: commitHash,
          lastCommitDate: commitDate,
          ahead: 0, // Simplified
          behind: 0, // Simplified
          status: changes.length > 0 ? 'dirty' : 'clean',
          changes
        });
      }
      
      return branches;
    } catch (error) {
      this._logger.error('Failed to get all branches info:', error);
      throw error;
    }
  }

  /**
   * Start a solo workflow
   */
  async startWorkflow(workflowType: 'feature' | 'bugfix' | 'refactor' | 'hotfix', workflowName: string): Promise<SoloWorkflow> {
    this._logger.info(`🚀 Starting ${workflowType} workflow: ${workflowName}`);
    
    try {
      // Get workflow template
      const workflowTemplate = this.workflowConfig.workflows[workflowType];
      
      // Create workflow instance
      const workflow: SoloWorkflow = {
        ...workflowTemplate,
        id: `${workflowType}-${Date.now()}`,
        name: `${workflowTemplate.name}: ${workflowName}`,
        description: `${workflowTemplate.description} for ${workflowName}`,
        status: 'running',
        startTime: new Date().toISOString(),
        branchName: `${workflowType}/${workflowName}`,
        changes: []
      };
      
      // Store workflow
      this.workflowHistory.set(workflow.id, workflow);
      
      this._logger.info(`✅ Started ${workflowType} workflow: ${workflowName}`);
      this.emit('workflow:started', { workflow });
      
      return workflow;
    } catch (error) {
      this._logger.error(`Failed to start ${workflowType} workflow:`, error);
      throw error;
    }
  }

  /**
   * Execute a workflow step
   */
  async executeWorkflowStep(workflowId: string, stepId: string): Promise<WorkflowStep> {
    this._logger.info(`⚡ Executing workflow step: ${stepId}`);
    
    try {
      const workflow = this.workflowHistory.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }
      
      const step = workflow.steps.find(s => s.id === stepId);
      if (!step) {
        throw new Error(`Step ${stepId} not found in workflow ${workflowId}`);
      }
      
      // Update step status
      step.status = 'running';
      
      const startTime = Date.now();
      
      try {
        // Execute step command
        const { stdout } = await execAsync(step.command);
        
        // Update step status
        step.status = 'completed';
        step.output = stdout;
        step.duration = Date.now() - startTime;
        
        this._logger.info(`✅ Workflow step completed: ${stepId}`);
        this.emit('workflow-step:completed', { workflowId, stepId, step });
        
      } catch (error) {
        // Update step status
        step.status = 'failed';
        step.error = error instanceof Error ? error.message : String(error);
        step.duration = Date.now() - startTime;
        
        this._logger.error(`❌ Workflow step failed: ${stepId}`, error);
        this.emit('workflow-step:failed', { workflowId, stepId, step, error });
      }
      
      // Update workflow status
      this.updateWorkflowStatus(workflow);
      
      return step;
    } catch (error) {
      this._logger.error(`Failed to execute workflow step ${stepId}:`, error);
      throw error;
    }
  }

  /**
   * Complete a workflow
   */
  async completeWorkflow(workflowId: string): Promise<SoloWorkflow> {
    this._logger.info(`🎉 Completing workflow: ${workflowId}`);
    
    try {
      const workflow = this.workflowHistory.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }
      
      // Update workflow status
      workflow.status = 'completed';
      workflow.endTime = new Date().toISOString();
      workflow.duration = new Date(workflow.endTime).getTime() - new Date(workflow.startTime!).getTime();
      
      // Store workflow
      this.workflowHistory.set(workflowId, workflow);
      
      this._logger.info(`✅ Workflow completed: ${workflowId}`);
      this.emit('workflow:completed', { workflow });
      
      return workflow;
    } catch (error) {
      this._logger.error(`Failed to complete workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Update workflow status
   */
  private updateWorkflowStatus(workflow: SoloWorkflow): void {
    const completedSteps = workflow.steps.filter(step => step.status === 'completed').length;
    const failedSteps = workflow.steps.filter(step => step.status === 'failed').length;
    const totalSteps = workflow.steps.length;
    
    if (failedSteps > 0) {
      workflow.status = 'failed';
    } else if (completedSteps === totalSteps) {
      workflow.status = 'completed';
    } else {
      workflow.status = 'running';
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(branchName: string, baseBranch: string = 'main'): Promise<void> {
    this._logger.info(`🌿 Creating branch: ${branchName}`);
    
    try {
      // Checkout base branch
      await execAsync(`git checkout ${baseBranch}`);
      
      // Create new branch
      await execAsync(`git checkout -b ${branchName}`);
      
      this._logger.info(`✅ Branch created: ${branchName}`);
      this.emit('branch:created', { branchName, baseBranch });
    } catch (error) {
      this._logger.error(`Failed to create branch ${branchName}:`, error);
      throw error;
    }
  }

  /**
   * Switch to a branch
   */
  async switchBranch(branchName: string): Promise<void> {
    this._logger.info(`🔄 Switching to branch: ${branchName}`);
    
    try {
      await execAsync(`git checkout ${branchName}`);
      
      this._logger.info(`✅ Switched to branch: ${branchName}`);
      this.emit('branch:switched', { branchName });
    } catch (error) {
      this._logger.error(`Failed to switch to branch ${branchName}:`, error);
      throw error;
    }
  }

  /**
   * Merge branch to main
   */
  async mergeBranch(branchName: string, targetBranch: string = 'main'): Promise<void> {
    this._logger.info(`🔀 Merging branch ${branchName} to ${targetBranch}`);
    
    try {
      // Switch to target branch
      await execAsync(`git checkout ${targetBranch}`);
      
      // Merge branch
      await execAsync(`git merge ${branchName}`);
      
      this._logger.info(`✅ Branch merged: ${branchName} to ${targetBranch}`);
      this.emit('branch:merged', { branchName, targetBranch });
    } catch (error) {
      this._logger.error(`Failed to merge branch ${branchName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a branch
   */
  async deleteBranch(branchName: string, force: boolean = false): Promise<void> {
    this._logger.info(`🗑️ Deleting branch: ${branchName}`);
    
    try {
      const command = force ? `git branch -D ${branchName}` : `git branch -d ${branchName}`;
      await execAsync(command);
      
      this._logger.info(`✅ Branch deleted: ${branchName}`);
      this.emit('branch:deleted', { branchName, force });
    } catch (error) {
      this._logger.error(`Failed to delete branch ${branchName}:`, error);
      throw error;
    }
  }

  /**
   * Get workflow statistics
   */
  getWorkflowStats(): any {
    const workflows = Array.from(this.workflowHistory.values());
    
    return {
      totalWorkflows: workflows.length,
      completedWorkflows: workflows.filter(w => w.status === 'completed').length,
      failedWorkflows: workflows.filter(w => w.status === 'failed').length,
      runningWorkflows: workflows.filter(w => w.status === 'running').length,
      averageDuration: workflows.reduce((sum, w) => sum + (w.duration || 0), 0) / workflows.length,
      byType: workflows.reduce((acc, w) => {
        const type = w.id.split('-')[0];
        if (type) {
          acc[type] = (acc[type] || 0) + 1;
        }
        return acc;
      }, {} as any),
      lastWorkflow: workflows[workflows.length - 1]
    };
  }

  /**
   * Clear workflow history
   */
  clearWorkflowHistory(): void {
    this.workflowHistory.clear();
    this._logger.info('🗑️ Workflow history cleared');
    this.emit('workflow-history:cleared');
  }

  /**
   * Export workflow data
   */
  async exportWorkflowData(exportPath: string): Promise<void> {
    try {
      const workflowData = {
        workflows: Array.from(this.workflowHistory.entries()),
        stats: this.getWorkflowStats(),
        config: this.workflowConfig,
        exportedAt: new Date().toISOString()
      };
      
      await fs.writeJson(exportPath, workflowData, { spaces: 2 });
      this._logger.info(`📤 Workflow data exported to: ${exportPath}`);
      this.emit('workflow-data:exported', { exportPath });
    } catch (error) {
      this._logger.error('Failed to export workflow data:', error);
      throw error;
    }
  }
}
