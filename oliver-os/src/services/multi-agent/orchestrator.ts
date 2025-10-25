/**
 * Central Orchestrator Agent for Oliver-OS Multi-Agent System
 * Coordinates all agents and tracks progress in DEV MODE
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';
import type {
  AgentType,
  AgentStatus,
  TaskDefinition,
  TaskProgress,
  AgentMessage,
  AgentCapabilities,
  TaskResult,
  AgentHealth
} from './types';

export class CentralOrchestrator extends EventEmitter {
  private _logger: Logger;
  // private _config!: Config; // Unused for now
  private agents: Map<AgentType, AgentStatus> = new Map();
  private activeTasks: Map<string, TaskDefinition> = new Map();
  private taskProgress: Map<string, TaskProgress> = new Map();
  private agentHealth: Map<AgentType, AgentHealth> = new Map();
  private isDevMode: boolean = true;

  constructor(_config: Config) {
    super();
    this._logger = new Logger('CentralOrchestrator');
    this.isDevMode = !process.env['CODEBUFF_API_KEY'] || process.env['NODE_ENV'] === 'development';
    
    this._logger.info(`🧠 Central Orchestrator initialized in ${this.isDevMode ? 'DEV MODE' : 'RUN MODE'}`);
    this.initializeAgents();
  }

  /**
   * Initialize all agent types with their capabilities
   */
  private initializeAgents(): void {
    const agentTypes: AgentType[] = ['frontend', 'backend', 'ai-services', 'database', 'integration'];
    
    agentTypes.forEach(agentType => {
      const capabilities = this.getAgentCapabilities(agentType);
      const status: AgentStatus = {
        id: `${agentType}-agent`,
        type: agentType,
        status: 'idle',
        capabilities,
        lastActivity: new Date().toISOString(),
        metadata: {
          devMode: this.isDevMode,
          mockMode: this.isDevMode
        }
      };

      this.agents.set(agentType, status);
      this.agentHealth.set(agentType, {
        status: 'healthy',
        lastHeartbeat: new Date().toISOString(),
        uptime: 0,
        tasksCompleted: 0,
        tasksFailed: 0
      });

      this._logger.info(`🤖 Initialized ${agentType} agent with capabilities: ${capabilities.join(', ')}`);
    });

    this.emit('orchestrator:initialized', { agentCount: agentTypes.length, devMode: this.isDevMode });
  }

  /**
   * Get capabilities for each agent type
   */
  private getAgentCapabilities(agentType: AgentType): AgentCapabilities {
    const capabilities: Record<AgentType, AgentCapabilities> = {
      'frontend': ['react-components', 'typescript', 'tailwind', 'state-management', 'ui-ux'],
      'backend': ['express-apis', 'middleware', 'authentication', 'websocket', 'microservices'],
      'ai-services': ['thought-processing', 'pattern-recognition', 'ai-integration', 'nlp', 'ml-models'],
      'database': ['schema-design', 'migrations', 'queries', 'optimization', 'multi-db'],
      'integration': ['api-integration', 'webhook-handling', 'data-sync', 'error-handling', 'monitoring']
    };

    return capabilities[agentType];
  }

  /**
   * Distribute task to appropriate agents
   */
  async distributeTask(task: TaskDefinition): Promise<string> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this._logger.info(`📋 Distributing task: ${task.name} to ${task.assignedAgents.join(', ')}`);
    
    // Initialize task progress tracking
    const progress: TaskProgress = {
      taskId,
      taskName: task.name,
      status: 'in-progress',
      assignedAgents: task.assignedAgents,
      agentProgress: new Map(),
      overallProgress: 0,
      startTime: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + task.estimatedDuration).toISOString(),
      subtasks: task.subtasks || [],
      metadata: task.metadata || {}
    };

    this.activeTasks.set(taskId, task);
    this.taskProgress.set(taskId, progress);

    // Assign subtasks to agents
    for (const agentType of task.assignedAgents) {
      const agentStatus = this.agents.get(agentType);
      if (agentStatus) {
        agentStatus.status = 'busy';
        agentStatus.currentTask = taskId;
        agentStatus.lastActivity = new Date().toISOString();

        // Simulate agent task assignment
        await this.assignTaskToAgent(agentType, taskId, task);
      }
    }

    this.emit('task:distributed', { taskId, task, progress });
    return taskId;
  }

  /**
   * Assign task to specific agent (simulated in dev mode)
   */
  private async assignTaskToAgent(agentType: AgentType, taskId: string, task: TaskDefinition): Promise<void> {
    const agentStatus = this.agents.get(agentType);
    if (!agentStatus) return;

    this._logger.info(`🎯 Assigning task ${taskId} to ${agentType} agent`);

    // Simulate agent processing in dev mode
    if (this.isDevMode) {
      await this.simulateAgentProcessing(agentType, taskId, task);
    } else {
      // In run mode, this would communicate with real agents
      await this.sendRealMessageToAgent(agentType, { 
        id: `msg-${Date.now()}`,
        type: 'task-assignment', 
        sender: 'orchestrator',
        recipient: agentType,
        content: { task }, 
        timestamp: new Date().toISOString(),
        priority: 'normal'
      });
    }
  }

  /**
   * Simulate agent processing in dev mode
   */
  private async simulateAgentProcessing(agentType: AgentType, taskId: string, task: TaskDefinition): Promise<void> {
    const progress = this.taskProgress.get(taskId);
    if (!progress) return;

    // Simulate processing time based on task complexity
    const processingTime = this.calculateProcessingTime(task, agentType);
    
    this._logger.info(`🔄 Simulating ${agentType} agent processing for ${processingTime}ms`);

    // Simulate progress updates
    const progressSteps = [25, 50, 75, 100];
    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, processingTime / progressSteps.length));
      
      // Update agent progress
      progress.agentProgress.set(agentType, {
        agentType,
        progress: step,
        status: step === 100 ? 'completed' : 'in-progress',
        lastUpdate: new Date().toISOString(),
        subtasks: this.generateMockSubtasks(agentType, task)
      });

      // Update overall progress
      progress.overallProgress = this.calculateOverallProgress(progress);
      
      // Emit progress update
      this.emit('task:progress', { taskId, agentType, progress: step, overallProgress: progress.overallProgress });
      
      this._logger.info(`📊 Task ${taskId} progress: ${agentType} ${step}%, Overall ${progress.overallProgress}%`);
    }

    // Mark agent as completed
    const agentStatus = this.agents.get(agentType);
    if (agentStatus) {
      agentStatus.status = 'idle';
      agentStatus.currentTask = '';
      agentStatus.lastActivity = new Date().toISOString();
    }

    // Update health metrics
    const health = this.agentHealth.get(agentType);
    if (health) {
      health.tasksCompleted++;
      health.lastHeartbeat = new Date().toISOString();
    }

    // Check if all agents are done
    const allAgentsDone = task.assignedAgents.every(agentType => {
      const agentProgress = progress.agentProgress.get(agentType);
      return agentProgress?.status === 'completed';
    });

    if (allAgentsDone) {
      progress.status = 'completed';
      progress.endTime = new Date().toISOString();
      progress.duration = new Date(progress.endTime).getTime() - new Date(progress.startTime).getTime();
      
      this.emit('task:completed', { taskId, progress, result: this.generateMockTaskResult(task) });
      this._logger.info(`✅ Task ${taskId} completed successfully`);
    }
  }

  /**
   * Calculate processing time based on task complexity and agent type
   */
  private calculateProcessingTime(task: TaskDefinition, agentType: AgentType): number {
    const baseTime = 1000; // 1 second base
    const complexityMultiplier = task.complexity || 'medium';
    const agentMultiplier = this.getAgentProcessingMultiplier(agentType);
    
    const complexityMultipliers = {
      'low': 1,
      'medium': 2,
      'high': 4,
      'critical': 8
    };

    return baseTime * complexityMultipliers[complexityMultiplier] * agentMultiplier;
  }

  /**
   * Get processing multiplier for different agent types
   */
  private getAgentProcessingMultiplier(agentType: AgentType): number {
    const multipliers = {
      'frontend': 1.2,
      'backend': 1.5,
      'ai-services': 2.0,
      'database': 1.0,
      'integration': 1.8
    };

    return multipliers[agentType];
  }

  /**
   * Generate mock subtasks for agent
   */
  private generateMockSubtasks(agentType: AgentType, _task: TaskDefinition): string[] {
    const subtaskTemplates: Record<AgentType, string[]> = {
      'frontend': [
        'Creating React components',
        'Implementing TypeScript interfaces',
        'Setting up state management',
        'Applying Tailwind styling',
        'Testing component functionality'
      ],
      'backend': [
        'Setting up Express routes',
        'Implementing middleware',
        'Adding authentication logic',
        'Configuring WebSocket handlers',
        'Testing API endpoints'
      ],
      'ai-services': [
        'Processing thought patterns',
        'Running AI model inference',
        'Analyzing data patterns',
        'Generating insights',
        'Updating knowledge graph'
      ],
      'database': [
        'Designing database schema',
        'Creating migrations',
        'Optimizing queries',
        'Setting up indexes',
        'Testing data integrity'
      ],
      'integration': [
        'Configuring API connections',
        'Setting up webhook handlers',
        'Implementing data synchronization',
        'Adding error handling',
        'Monitoring system health'
      ]
    };

    return subtaskTemplates[agentType].slice(0, Math.floor(Math.random() * 3) + 2);
  }

  /**
   * Calculate overall task progress
   */
  private calculateOverallProgress(progress: TaskProgress): number {
    if (progress.agentProgress.size === 0) return 0;
    
    const totalProgress = Array.from(progress.agentProgress.values())
      .reduce((sum, agentProgress) => sum + agentProgress.progress, 0);
    
    return Math.round(totalProgress / progress.agentProgress.size);
  }

  /**
   * Generate mock task result
   */
  private generateMockTaskResult(task: TaskDefinition): TaskResult {
    return {
      success: true,
      taskId: task.id || 'unknown',
      duration: Date.now() - Date.now(), // Will be calculated properly
      artifacts: this.generateMockArtifacts(task),
      metrics: {
        agentsUsed: task.assignedAgents.length,
        processingTime: this.calculateProcessingTime(task, task.assignedAgents[0]!),
        successRate: 100,
        errorCount: 0
      },
      metadata: {
        devMode: this.isDevMode,
        mockResult: true
      }
    };
  }

  /**
   * Generate mock artifacts
   */
  private generateMockArtifacts(task: TaskDefinition): any[] {
    return task.assignedAgents.map(agentType => ({
      id: `artifact-${agentType}-${Date.now()}`,
      type: 'code',
      name: `${agentType}-implementation`,
      content: `Mock implementation for ${agentType} agent`,
      agentType,
      createdAt: new Date().toISOString()
    }));
  }

  /**
   * Get agent status
   */
  getAgentStatus(agentType: AgentType): AgentStatus | undefined {
    return this.agents.get(agentType);
  }

  /**
   * Get all agent statuses
   */
  getAllAgentStatuses(): Map<AgentType, AgentStatus> {
    return new Map(this.agents);
  }

  /**
   * Get task progress
   */
  getTaskProgress(taskId: string): TaskProgress | undefined {
    return this.taskProgress.get(taskId);
  }

  /**
   * Get all active tasks
   */
  getActiveTasks(): Map<string, TaskDefinition> {
    return new Map(this.activeTasks);
  }

  /**
   * Get system health
   */
  getSystemHealth(): {
    orchestrator: 'healthy' | 'degraded' | 'unhealthy';
    agents: Map<AgentType, AgentHealth>;
    activeTasks: number;
    completedTasks: number;
    devMode: boolean;
  } {
    const healthyAgents = Array.from(this.agentHealth.values())
      .filter(health => health.status === 'healthy').length;
    
    const totalAgents = this.agentHealth.size;
    const healthRatio = healthyAgents / totalAgents;

    let orchestratorHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (healthRatio < 0.5) {
      orchestratorHealth = 'unhealthy';
    } else if (healthRatio < 0.8) {
      orchestratorHealth = 'degraded';
    }

    return {
      orchestrator: orchestratorHealth,
      agents: new Map(this.agentHealth),
      activeTasks: this.activeTasks.size,
      completedTasks: Array.from(this.agentHealth.values())
        .reduce((sum, health) => sum + health.tasksCompleted, 0),
      devMode: this.isDevMode
    };
  }

  /**
   * Send message to specific agent
   */
  async sendMessageToAgent(agentType: AgentType, message: AgentMessage): Promise<void> {
    const agentStatus = this.agents.get(agentType);
    if (!agentStatus) {
      throw new Error(`Agent ${agentType} not found`);
    }

    this._logger.info(`📨 Sending message to ${agentType} agent: ${message.type}`);

    if (this.isDevMode) {
      // Simulate message processing
      await this.simulateMessageProcessing(agentType, message);
    } else {
      // In run mode, this would send real messages to agents
      await this.sendRealMessageToAgent(agentType, message);
    }
  }

  /**
   * Simulate message processing in dev mode
   */
  private async simulateMessageProcessing(agentType: AgentType, message: AgentMessage): Promise<void> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Emit message processed event
    this.emit('message:processed', { agentType, message, timestamp: new Date().toISOString() });
    
    this._logger.info(`✅ Message processed by ${agentType} agent`);
  }

  /**
   * Send real message to agent (run mode)
   */
  private async sendRealMessageToAgent(agentType: AgentType, _message: AgentMessage): Promise<void> {
    // This would be implemented for run mode with real agent communication
    this._logger.info(`🚀 Sending real message to ${agentType} agent (run mode)`);
  }

  /**
   * Broadcast message to all agents
   */
  async broadcastMessage(message: AgentMessage): Promise<void> {
    this._logger.info(`📢 Broadcasting message to all agents: ${message.type}`);

    const agentTypes: AgentType[] = ['frontend', 'backend', 'ai-services', 'database', 'integration'];
    
    for (const agentType of agentTypes) {
      await this.sendMessageToAgent(agentType, message);
    }
  }

  /**
   * Shutdown orchestrator
   */
  async shutdown(): Promise<void> {
    this._logger.info('🛑 Shutting down Central Orchestrator');
    
    // Mark all agents as offline
    for (const [, status] of this.agents) {
      status.status = 'offline';
      status.lastActivity = new Date().toISOString();
    }

    this.emit('orchestrator:shutdown', { timestamp: new Date().toISOString() });
    this._logger.info('✅ Central Orchestrator shutdown complete');
  }
}
