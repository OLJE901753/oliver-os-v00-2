/**
 * Multi-Agent System Example for Oliver-OS
 * Demonstrates DEV MODE multi-agent orchestration
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { MultiAgentService } from '../src/services/multi-agent/multi-agent-service';
import { Config } from '../src/core/config';
import { Logger } from '../src/core/logger';
import type { TaskDefinition, AgentType } from '../src/services/multi-agent/types';

export class MultiAgentExample {
  private multiAgentService: MultiAgentService;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('MultiAgentExample');
    const config = new Config();
    this.multiAgentService = new MultiAgentService(config);
    
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for monitoring
   */
  private setupEventHandlers(): void {
    this.multiAgentService.on('service:ready', (data) => {
      this.logger.info('🎉 Multi-Agent Service is ready!');
      this.logger.info(`   Agents: ${data.agentCount}, Dev Mode: ${data.devMode}`);
    });

    this.multiAgentService.on('task:distributed', (data) => {
      this.logger.info(`📋 Task distributed: ${data.task.name}`);
      this.logger.info(`   Assigned agents: ${data.task.assignedAgents.join(', ')}`);
    });

    this.multiAgentService.on('task:progress', (data) => {
      this.logger.info(`📊 Progress update: ${data.taskId}`);
      this.logger.info(`   Agent: ${data.agentType}, Progress: ${data.progress}%, Overall: ${data.overallProgress}%`);
    });

    this.multiAgentService.on('task:completed', (data) => {
      this.logger.info(`✅ Task completed: ${data.taskId}`);
      this.logger.info(`   Duration: ${data.progress.duration}ms`);
    });

    this.multiAgentService.on('agent:task-completed', (data) => {
      this.logger.info(`🤖 Agent task completed: ${data.agentType}`);
    });

    this.multiAgentService.on('agent:task-failed', (data) => {
      this.logger.error(`❌ Agent task failed: ${data.agentType} - ${data.error}`);
    });

    this.multiAgentService.on('workflow:completed', (data) => {
      this.logger.info('🎉 Workflow completed successfully!');
      this.logger.info('   All agents finished their tasks');
    });
  }

  /**
   * Run basic multi-agent example
   */
  async runBasicExample(): Promise<void> {
    this.logger.info('🚀 Running basic multi-agent example');

    try {
      // Create a simple task for frontend agent
      const frontendTask: TaskDefinition = {
        id: 'basic-frontend-task',
        name: 'Create React Component',
        description: 'Create a simple React component with TypeScript',
        assignedAgents: ['frontend'],
        complexity: 'low',
        estimatedDuration: 15000,
        subtasks: [
          'Create component file',
          'Add TypeScript interfaces',
          'Implement component logic',
          'Add styling'
        ],
        metadata: {
          componentName: 'BasicComponent',
          framework: 'React',
          language: 'TypeScript'
        }
      };

      // Distribute the task
      const taskId = await this.multiAgentService.distributeTask(frontendTask);
      this.logger.info(`📋 Task distributed with ID: ${taskId}`);

      // Monitor progress
      await this.monitorTaskProgress(taskId);

    } catch (error) {
      this.logger.error(`Basic example failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run multi-agent collaboration example
   */
  async runCollaborationExample(): Promise<void> {
    this.logger.info('🤝 Running multi-agent collaboration example');

    try {
      // Create a complex task that requires multiple agents
      const collaborationTask: TaskDefinition = {
        id: 'collaboration-task',
        name: 'Build Complete Feature',
        description: 'Build a complete feature with frontend, backend, database, and AI integration',
        assignedAgents: ['frontend', 'backend', 'database', 'ai-services'],
        complexity: 'high',
        estimatedDuration: 60000,
        subtasks: [
          'Design database schema',
          'Create API endpoints',
          'Build frontend components',
          'Integrate AI processing',
          'Test end-to-end functionality'
        ],
        metadata: {
          featureName: 'ThoughtProcessingFeature',
          requiresIntegration: true,
          aiProcessing: true
        }
      };

      // Distribute the collaboration task
      const taskId = await this.multiAgentService.distributeTask(collaborationTask);
      this.logger.info(`📋 Collaboration task distributed with ID: ${taskId}`);

      // Monitor progress
      await this.monitorTaskProgress(taskId);

    } catch (error) {
      this.logger.error(`Collaboration example failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run the sample workflow
   */
  async runSampleWorkflow(): Promise<void> {
    this.logger.info('🎬 Running sample workflow');

    try {
      await this.multiAgentService.runSampleWorkflow();
    } catch (error) {
      this.logger.error(`Sample workflow failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Monitor task progress
   */
  private async monitorTaskProgress(taskId: string): Promise<void> {
    this.logger.info(`👀 Monitoring task progress: ${taskId}`);

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const progress = this.multiAgentService.getTaskProgress(taskId);
        
        if (progress) {
          this.logger.info(`📊 Task ${taskId} progress: ${progress.overallProgress}%`);
          
          if (progress.status === 'completed') {
            clearInterval(checkInterval);
            this.logger.info(`✅ Task ${taskId} completed successfully!`);
            resolve();
          } else if (progress.status === 'failed') {
            clearInterval(checkInterval);
            this.logger.error(`❌ Task ${taskId} failed!`);
            reject(new Error(`Task ${taskId} failed`));
          }
        }
      }, 1000);

      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Task monitoring timeout'));
      }, 120000);
    });
  }

  /**
   * Display system status
   */
  displaySystemStatus(): void {
    this.logger.info('📊 System Status:');
    
    const metrics = this.multiAgentService.getSystemMetrics();
    this.logger.info(`   Total Agents: ${metrics.totalAgents}`);
    this.logger.info(`   Active Agents: ${metrics.activeAgents}`);
    this.logger.info(`   Total Tasks: ${metrics.totalTasks}`);
    this.logger.info(`   Active Tasks: ${metrics.activeTasks}`);
    this.logger.info(`   Completed Tasks: ${metrics.completedTasks}`);
    this.logger.info(`   Dev Mode: ${metrics.devMode}`);

    const health = this.multiAgentService.getSystemHealth();
    this.logger.info(`   System Health: ${health.orchestrator}`);
    this.logger.info(`   Active Tasks: ${health.activeTasks}`);
    this.logger.info(`   Completed Tasks: ${health.completedTasks}`);
  }

  /**
   * Display agent statuses
   */
  displayAgentStatuses(): void {
    this.logger.info('🤖 Agent Statuses:');
    
    const agentStatuses = this.multiAgentService.getAllAgentStatuses();
    agentStatuses.forEach((status, agentType) => {
      this.logger.info(`   ${agentType}: ${status.status}`);
      this.logger.info(`     Capabilities: ${status.capabilities.join(', ')}`);
      this.logger.info(`     Last Activity: ${status.lastActivity}`);
    });
  }

  /**
   * Run all examples
   */
  async runAllExamples(): Promise<void> {
    this.logger.info('🎯 Running all multi-agent examples');

    try {
      // Display initial status
      this.displaySystemStatus();
      this.displayAgentStatuses();

      // Run basic example
      await this.runBasicExample();
      
      // Wait a bit between examples
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Run collaboration example
      await this.runCollaborationExample();
      
      // Wait a bit between examples
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Run sample workflow
      await this.runSampleWorkflow();
      
      // Display final status
      this.displaySystemStatus();
      
      this.logger.info('🎉 All examples completed successfully!');

    } catch (error) {
      this.logger.error(`Examples failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Shutdown the example
   */
  async shutdown(): Promise<void> {
    this.logger.info('🛑 Shutting down Multi-Agent Example');
    await this.multiAgentService.shutdown();
    this.logger.info('✅ Multi-Agent Example shutdown complete');
  }
}

// CLI interface for running examples
export async function main() {
  const example = new MultiAgentExample();
  
  try {
    const command = process.argv[2] || 'all';
    
    switch (command) {
      case 'basic':
        await example.runBasicExample();
        break;
      case 'collaboration':
        await example.runCollaborationExample();
        break;
      case 'workflow':
        await example.runSampleWorkflow();
        break;
      case 'all':
        await example.runAllExamples();
        break;
      default:
        console.log('Available commands: basic, collaboration, workflow, all');
    }
    
  } catch (error) {
    console.error('❌ Multi-agent example failed:', error);
    process.exit(1);
  } finally {
    await example.shutdown();
  }
}

// Run if this is the main module
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
