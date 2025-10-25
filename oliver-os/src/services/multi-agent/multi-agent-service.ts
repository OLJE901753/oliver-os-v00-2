/**
 * Multi-Agent Service for Oliver-OS
 * Coordinates all agents and manages task distribution
 * DEV MODE implementation with mock agents
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';
import { CentralOrchestrator } from './orchestrator';
import { FrontendAgent } from './agents/frontend-agent';
import { BackendAgent } from './agents/backend-agent';
import { AIServicesAgent } from './agents/ai-services-agent';
import { DatabaseAgent } from './agents/database-agent';
import { IntegrationAgent } from './agents/integration-agent';
import type {
  AgentType,
  TaskDefinition,
  TaskProgress,
  AgentStatus,
  SystemMetrics,
  MultiAgentConfig
} from './types';

export class MultiAgentService extends EventEmitter {
  private _logger: Logger;
  private _config: Config;
  private orchestrator!: CentralOrchestrator;
  private agents: Map<AgentType, any> = new Map();
  private isDevMode: boolean = true;
  private serviceConfig: MultiAgentConfig;

  constructor(config: Config) {
    super();
    this._config = config;
    this._logger = new Logger('MultiAgentService');
    this.isDevMode = !process.env['CODEBUFF_API_KEY'] || process.env['NODE_ENV'] === 'development';
    
    this.serviceConfig = {
      devMode: this.isDevMode,
      maxConcurrentTasks: 10,
      agentTimeout: 60000,
      heartbeatInterval: 30000,
      retryAttempts: 3,
      enableMetrics: true,
      enablePersistence: true
    };

    this._logger.info(`🚀 Multi-Agent Service initialized in ${this.isDevMode ? 'DEV MODE' : 'RUN MODE'}`);
    
    this.initializeOrchestrator();
    this.initializeAgents();
    this.setupEventHandlers();
  }

  /**
   * Initialize the central orchestrator
   */
  private initializeOrchestrator(): void {
    this.orchestrator = new CentralOrchestrator(this._config);
    
    // Listen to orchestrator events
    this.orchestrator.on('task:distributed', (data: any) => {
      this.emit('task:distributed', data);
    });

    this.orchestrator.on('task:progress', (data: any) => {
      this.emit('task:progress', data);
    });

    this.orchestrator.on('task:completed', (data: any) => {
      this.emit('task:completed', data);
    });

    this.orchestrator.on('orchestrator:initialized', (data: any) => {
      this._logger.info(`✅ Orchestrator initialized with ${data.agentCount} agents`);
      this.emit('service:ready', data);
    });

    this._logger.info('🧠 Central Orchestrator initialized');
  }

  /**
   * Initialize all agent instances
   */
  private initializeAgents(): void {
    const agentTypes: AgentType[] = ['frontend', 'backend', 'ai-services', 'database', 'integration'];
    
    agentTypes.forEach(agentType => {
      const agent = this.createAgent(agentType);
      this.agents.set(agentType, agent);
      
      // Listen to agent events
      agent.on('task:completed', (data: any) => {
        this.emit('agent:task-completed', { agentType, ...data });
      });

      agent.on('task:failed', (data: any) => {
        this.emit('agent:task-failed', { agentType, ...data });
      });

      agent.on('health:check', (data: any) => {
        this.emit('agent:health-check', { agentType, ...data });
      });

      this._logger.info(`🤖 ${agentType} agent initialized`);
    });

    this._logger.info(`✅ All ${agentTypes.length} agents initialized`);
  }

  /**
   * Create agent instance based on type
   */
  private createAgent(agentType: AgentType): any {
    switch (agentType) {
      case 'frontend':
        return new FrontendAgent(this.isDevMode);
      case 'backend':
        return new BackendAgent(this.isDevMode);
      case 'ai-services':
        return new AIServicesAgent(this.isDevMode);
      case 'database':
        return new DatabaseAgent(this.isDevMode);
      case 'integration':
        return new IntegrationAgent(this.isDevMode);
      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Handle service-level events
    this.on('service:ready', (_data: any) => {
      this._logger.info('🎉 Multi-Agent Service ready for task processing');
    });

    this.on('task:distributed', (data) => {
      this._logger.info(`📋 Task distributed: ${data.task.name}`);
    });

    this.on('task:progress', (data) => {
      this._logger.info(`📊 Task progress: ${data.taskId} - ${data.overallProgress}%`);
    });

    this.on('task:completed', (data) => {
      this._logger.info(`✅ Task completed: ${data.taskId}`);
    });
  }

  /**
   * Distribute task to appropriate agents
   */
  async distributeTask(task: TaskDefinition): Promise<string> {
    this._logger.info(`📋 Distributing task: ${task.name}`);
    
    try {
      const taskId = await this.orchestrator.distributeTask(task);
      this.emit('task:distributed', { taskId, task });
      return taskId;
    } catch (error) {
      this._logger.error(`Failed to distribute task: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get task progress
   */
  getTaskProgress(taskId: string): TaskProgress | undefined {
    return this.orchestrator.getTaskProgress(taskId);
  }

  /**
   * Get agent status
   */
  getAgentStatus(agentType: AgentType): AgentStatus | undefined {
    return this.orchestrator.getAgentStatus(agentType);
  }

  /**
   * Get all agent statuses
   */
  getAllAgentStatuses(): Map<AgentType, AgentStatus> {
    return this.orchestrator.getAllAgentStatuses();
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const health = this.orchestrator.getSystemHealth();
    const activeTasks = this.orchestrator.getActiveTasks();
    
    return {
      totalAgents: this.agents.size,
      activeAgents: Array.from(this.agents.values()).filter(agent => 
        agent.getAgentStatus().status !== 'offline'
      ).length,
      totalTasks: activeTasks.size,
      activeTasks: activeTasks.size,
      completedTasks: health.completedTasks,
      failedTasks: 0, // Would be tracked in real implementation
      averageTaskDuration: 0, // Would be calculated in real implementation
      systemUptime: Date.now(), // Would be tracked in real implementation
      devMode: this.isDevMode
    };
  }

  /**
   * Send message to specific agent
   */
  async sendMessageToAgent(agentType: AgentType, message: any): Promise<void> {
    const agent = this.agents.get(agentType);
    if (!agent) {
      throw new Error(`Agent ${agentType} not found`);
    }

    await agent.handleMessage(message);
  }

  /**
   * Broadcast message to all agents
   */
  async broadcastMessage(message: any): Promise<void> {
    this._logger.info(`📢 Broadcasting message to all agents: ${message.type}`);
    
    const agentTypes: AgentType[] = ['frontend', 'backend', 'ai-services', 'database', 'integration'];
    
    for (const agentType of agentTypes) {
      await this.sendMessageToAgent(agentType, message);
    }
  }

  /**
   * Get system health
   */
  getSystemHealth(): any {
    return this.orchestrator.getSystemHealth();
  }

  /**
   * Create a sample task for testing
   */
  createSampleTask(taskName: string, assignedAgents: AgentType[]): TaskDefinition {
    return {
      id: `sample-task-${Date.now()}`,
      name: taskName,
      description: `Sample task for testing multi-agent system: ${taskName}`,
      assignedAgents,
      complexity: 'medium',
      estimatedDuration: 30000, // 30 seconds
      subtasks: [
        `Setup ${assignedAgents[0]!} implementation`,
        `Test ${assignedAgents[0]!} functionality`,
        `Integrate ${assignedAgents[0]!} with other agents`
      ],
      metadata: {
        createdBy: 'MultiAgentService',
        devMode: this.isDevMode,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Run a sample workflow
   */
  async runSampleWorkflow(): Promise<void> {
    this._logger.info('🎬 Running sample multi-agent workflow');

    try {
      // Create sample tasks
      const frontendTask = this.createSampleTask('Create React Component', ['frontend']);
      const backendTask = this.createSampleTask('Create API Endpoint', ['backend']);
      const aiTask = this.createSampleTask('Process Thought', ['ai-services']);
      const dbTask = this.createSampleTask('Design Database Schema', ['database']);
      const integrationTask = this.createSampleTask('Setup API Integration', ['integration']);

      // Distribute tasks
      const frontendTaskId = await this.distributeTask(frontendTask);
      const backendTaskId = await this.distributeTask(backendTask);
      const aiTaskId = await this.distributeTask(aiTask);
      const dbTaskId = await this.distributeTask(dbTask);
      const integrationTaskId = await this.distributeTask(integrationTask);

      this._logger.info(`✅ Sample workflow started with 5 tasks:
        - Frontend: ${frontendTaskId}
        - Backend: ${backendTaskId}
        - AI Services: ${aiTaskId}
        - Database: ${dbTaskId}
        - Integration: ${integrationTaskId}`);

      // Monitor progress
      const monitorProgress = setInterval(() => {
        const frontendProgress = this.getTaskProgress(frontendTaskId);
        const backendProgress = this.getTaskProgress(backendTaskId);
        const aiProgress = this.getTaskProgress(aiTaskId);
        const dbProgress = this.getTaskProgress(dbTaskId);
        const integrationProgress = this.getTaskProgress(integrationTaskId);

        const allCompleted = [frontendProgress, backendProgress, aiProgress, dbProgress, integrationProgress]
          .every(progress => progress?.status === 'completed');

        if (allCompleted) {
          clearInterval(monitorProgress);
          this._logger.info('🎉 Sample workflow completed successfully!');
          this.emit('workflow:completed', {
            frontendTaskId,
            backendTaskId,
            aiTaskId,
            dbTaskId,
            integrationTaskId
          });
        }
      }, 1000);

    } catch (error) {
      this._logger.error(`Sample workflow failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get service configuration
   */
  getServiceConfig(): MultiAgentConfig {
    return this.serviceConfig;
  }

  /**
   * Update service configuration
   */
  updateServiceConfig(newConfig: Partial<MultiAgentConfig>): void {
    this.serviceConfig = { ...this.serviceConfig, ...newConfig };
    this._logger.info('🔧 Service configuration updated');
  }

  /**
   * Shutdown the multi-agent service
   */
  async shutdown(): Promise<void> {
    this._logger.info('🛑 Shutting down Multi-Agent Service');
    
    // Shutdown orchestrator
    await this.orchestrator.shutdown();
    
    // Clear agents
    this.agents.clear();
    
    this.emit('service:shutdown', { timestamp: new Date().toISOString() });
    this._logger.info('✅ Multi-Agent Service shutdown complete');
  }
}
