/**
 * Base Agent Class for Oliver-OS Multi-Agent System
 * DEV MODE implementation with mock behavior
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../../core/logger';
import type {
  AgentType,
  AgentCapabilities,
  TaskDefinition,
  AgentMessage,
  AgentResponse,
  AgentMockConfig,
  DevModeConfig
} from '../types';

export abstract class BaseAgent extends EventEmitter {
  protected logger: Logger;
  protected agentType: AgentType;
  protected capabilities: AgentCapabilities;
  protected isDevMode: boolean;
  protected mockConfig: AgentMockConfig;
  protected devConfig: DevModeConfig;

  constructor(
    agentType: AgentType,
    capabilities: AgentCapabilities,
    devMode: boolean = true
  ) {
    super();
    this.agentType = agentType;
    this.capabilities = capabilities;
    this.isDevMode = devMode;
    this.logger = new Logger(`${agentType}Agent`);
    
    this.mockConfig = {
      processingTimeRange: [1000, 3000],
      successRate: 0.95,
      errorSimulation: false,
      mockDataGeneration: true
    };

    this.devConfig = {
      enabled: devMode,
      mockResponses: true,
      simulateDelays: true,
      logLevel: 'info',
      mockDataGeneration: true
    };

    this.logger.info(`🤖 ${agentType} agent initialized in ${devMode ? 'DEV MODE' : 'RUN MODE'}`);
  }

  /**
   * Get agent type
   */
  getAgentType(): AgentType {
    return this.agentType;
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): AgentCapabilities {
    return this.capabilities;
  }

  /**
   * Check if agent has specific capability
   */
  hasCapability(capability: string): boolean {
    return this.capabilities.includes(capability);
  }

  /**
   * Process task (abstract method to be implemented by specific agents)
   */
  abstract processTask(task: TaskDefinition): Promise<AgentResponse>;

  /**
   * Handle incoming message
   */
  async handleMessage(message: AgentMessage): Promise<void> {
    this.logger.info(`📨 Received message: ${message.type} from ${message.sender}`);

    switch (message.type) {
      case 'task-assignment':
        await this.handleTaskAssignment(message);
        break;
      case 'progress-update':
        await this.handleProgressUpdate(message);
        break;
      case 'status-change':
        await this.handleStatusChange(message);
        break;
      case 'health-check':
        await this.handleHealthCheck(message);
        break;
      case 'broadcast':
        await this.handleBroadcast(message);
        break;
      default:
        this.logger.warn(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle task assignment
   */
  private async handleTaskAssignment(message: AgentMessage): Promise<void> {
    const task = message.content['task'] as TaskDefinition;
    if (!task) {
      this.logger.error('No task provided in task assignment message');
      return;
    }

    this.logger.info(`🎯 Processing task: ${task.name}`);
    
    try {
      const response = await this.processTask(task);
      this.emit('task:completed', response);
    } catch (error) {
      this.logger.error(`Task processing failed: ${error instanceof Error ? error.message : String(error)}`);
      this.emit('task:failed', { taskId: task.id, error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Handle progress update
   */
  private async handleProgressUpdate(_message: AgentMessage): Promise<void> {
    this.logger.info('📊 Handling progress update');
    // Implementation for progress updates
  }

  /**
   * Handle status change
   */
  private async handleStatusChange(_message: AgentMessage): Promise<void> {
    this.logger.info('🔄 Handling status change');
    // Implementation for status changes
  }

  /**
   * Handle health check
   */
  private async handleHealthCheck(_message: AgentMessage): Promise<void> {
    const healthStatus = {
      agentType: this.agentType,
      status: 'healthy',
      capabilities: this.capabilities,
      timestamp: new Date().toISOString()
    };

    this.emit('health:check', healthStatus);
    this.logger.info('💓 Health check completed');
  }

  /**
   * Handle broadcast message
   */
  private async handleBroadcast(_message: AgentMessage): Promise<void> {
    this.logger.info('📢 Handling broadcast message');
    // Implementation for broadcast messages
  }

  /**
   * Simulate processing delay in dev mode
   */
  protected async simulateProcessingDelay(): Promise<void> {
    if (!this.isDevMode || !this.devConfig.simulateDelays) return;

    const [min, max] = this.mockConfig.processingTimeRange;
    const delay = Math.random() * (max - min) + min;
    
    this.logger.info(`⏳ Simulating processing delay: ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Generate mock response in dev mode
   */
  protected generateMockResponse(task: TaskDefinition): AgentResponse {
    const success = Math.random() < this.mockConfig.successRate;
    
    return {
      taskId: task.id || 'unknown',
      agentType: this.agentType,
      status: success ? 'completed' : 'failed',
      progress: success ? 100 : Math.floor(Math.random() * 50),
      result: success ? this.generateMockResult(task) : undefined,
      ...(success ? {} : { error: 'Mock error simulation' }),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate mock result (to be implemented by specific agents)
   */
  protected abstract generateMockResult(task: TaskDefinition): any;

  /**
   * Log agent activity
   */
  protected logActivity(activity: string, data?: any): void {
    this.logger.info(`🤖 ${this.agentType} agent: ${activity}`, data);
  }

  /**
   * Emit agent event
   */
  protected emitAgentEvent(eventType: string, data: any): void {
    this.emit(eventType, {
      agentType: this.agentType,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  /**
   * Get agent status
   */
  getAgentStatus(): {
    agentType: AgentType;
    capabilities: AgentCapabilities;
    isDevMode: boolean;
    mockConfig: AgentMockConfig;
    devConfig: DevModeConfig;
  } {
    return {
      agentType: this.agentType,
      capabilities: this.capabilities,
      isDevMode: this.isDevMode,
      mockConfig: this.mockConfig,
      devConfig: this.devConfig
    };
  }
}
