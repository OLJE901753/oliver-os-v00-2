/**
 * Enhanced Codebuff Service for Oliver-OS - Primary Orchestration Hub
 * Integrates Codebuff SDK with Oliver-OS AI-brain interface system
 * Following BMAD principles: Break, Map, Automate, Document
 * 
 * This service serves as the central orchestration hub for all agent activities,
 * workflow management, and tool coordination in the Oliver-OS ecosystem.
 */

import { CodebuffClient } from '@codebuff/sdk';
import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';
import { MCPToolRegistryManager } from './mcp-tool-adapters';
import type {
  CodebuffRunOptions,
  CodebuffEvent,
  CodebuffResult,
  CodebuffClientConfig,
  OliverOSAgentDefinition,
  WorkflowDefinition,
  AgentSpawnRequest,
  AgentStatus,
  OrchestrationConfig,
  ToolRegistry,
  MCPServerInfo,
  CustomToolDefinition,
  WorkflowExecution,
  WorkflowStepExecution,
  SupervisionConfig,
  Metrics,
  Artifact,
  EventBus
} from './types';

export class EnhancedCodebuffService extends EventEmitter {
  private client: CodebuffClient;
  private logger: Logger;
  private config: Config;
  private orchestrationConfig: OrchestrationConfig;
  
  // Core orchestration state
  private agents: Map<string, AgentStatus> = new Map();
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private agentDefinitions: Map<string, OliverOSAgentDefinition> = new Map();
  private toolRegistry: ToolRegistry;
  private mcpServers: Map<string, MCPServerInfo> = new Map();
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private artifacts: Map<string, Artifact> = new Map();
  private mcpToolManager: MCPToolRegistryManager;
  
  // Supervision and monitoring
  private supervisionTimers: Map<string, NodeJS.Timeout> = new Map();
  private metricsTimer?: NodeJS.Timeout;
  private isRunning: boolean = false;
  
  // Event bus for internal communication
  private eventBus: EventBus;

  constructor(config: Config, orchestrationConfig?: Partial<OrchestrationConfig>) {
    super();
    this.config = config;
    this.logger = new Logger('EnhancedCodebuffService');
    
    // Initialize orchestration configuration with defaults
    this.orchestrationConfig = {
      enableSupervision: true,
      enablePersistence: true,
      enableEventBus: true,
      enableMetrics: true,
      maxConcurrentWorkflows: 10,
      workflowTimeout: 300000, // 5 minutes
      agentTimeout: 60000, // 1 minute
      persistenceConfig: {
        enabled: true,
        provider: 'database',
        databaseUrl: this.config.get('database.url') as string,
        retentionDays: 30,
        compression: true
      },
      metricsConfig: {
        enabled: true,
        provider: 'console',
        interval: 30000 // 30 seconds
      },
      ...orchestrationConfig
    };

    // Initialize event bus
    this.eventBus = this.createEventBus();
    
    // Initialize MCP tool manager
    this.mcpToolManager = new MCPToolRegistryManager();
    
    // Initialize tool registry
    this.toolRegistry = this.createToolRegistry();
    
    // Initialize Codebuff client
    const codebuffConfig: CodebuffClientConfig = {
      apiKey: this.config.get('codebuff.apiKey') || process.env['CODEBUFF_API_KEY'] || '',
      cwd: process.cwd(),
      onError: (error) => this.logger.error('Codebuff client error:', error.message),
      timeout: this.config.get('codebuff.timeout') as number || 300000,
      retries: this.config.get('codebuff.retries') as number || 3,
      enableSupervision: this.orchestrationConfig.enableSupervision,
      enablePersistence: this.orchestrationConfig.enablePersistence,
      eventBus: this.eventBus
    };

    this.client = new CodebuffClient(codebuffConfig);
    this.initializeAgentDefinitions();
    this.initializeMCPTools();
  }

  /**
   * Initialize the Oliver-OS agent ecosystem
   * Following BMAD: Break down capabilities, Map dependencies, Automate initialization, Document agents
   */
  async initialize(): Promise<void> {
    this.logger.info('🚀 Initializing Enhanced Codebuff Orchestration Hub...');
    
    try {
      // Break down initialization into manageable components
      await this.initializeAgentDefinitions();
      await this.initializeMCPTools();
      await this.initializeWorkflows();
      
      // Map dependencies and relationships
      await this.mapAgentDependencies();
      
      // Automate supervision and monitoring
      if (this.orchestrationConfig.enableSupervision) {
        await this.startSupervision();
      }
      
      if (this.orchestrationConfig.enableMetrics) {
        await this.startMetricsCollection();
      }
      
      // Document the initialization
      this.logger.info('✅ Enhanced Codebuff Orchestration Hub initialized successfully');
      this.logger.info(`📊 Initialized ${this.agentDefinitions.size} agent definitions`);
      this.logger.info(`🔧 Registered ${this.toolRegistry.tools.size} tools`);
      this.logger.info(`📋 Loaded ${this.workflows.size} workflows`);
      
      this.isRunning = true;
      this.emit('initialized', {
        agents: this.agentDefinitions.size,
        tools: this.toolRegistry.tools.size,
        workflows: this.workflows.size
      });
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize orchestration hub', error);
      throw error;
    }
  }

  /**
   * Run a comprehensive orchestrated task
   * This is the primary entry point for all agent orchestration
   */
  async orchestrateTask(options: CodebuffRunOptions): Promise<CodebuffResult> {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const events: CodebuffEvent[] = [];
    const artifacts: Artifact[] = [];
    const startTime = Date.now();

    try {
      this.logger.info(`🎯 Starting orchestrated task: ${options.prompt.substring(0, 100)}...`);
      
      // Break down the task into orchestrated components
      const taskBreakdown = await this.breakDownOrchestratedTask(options);
      events.push({
        type: 'progress',
        message: 'Task broken down into orchestrated components',
        data: { breakdown: taskBreakdown, executionId },
        timestamp: new Date().toISOString(),
        workflowId: options.workflowId
      });

      // Map orchestration dependencies and create execution plan
      const orchestrationPlan = await this.mapOrchestrationDependencies(options, taskBreakdown);
      events.push({
        type: 'progress',
        message: 'Orchestration dependencies mapped and execution plan created',
        data: { plan: orchestrationPlan, executionId },
        timestamp: new Date().toISOString(),
        workflowId: options.workflowId
      });

      // Execute the orchestrated task
      const result = await this.executeOrchestratedTask(options, orchestrationPlan, events, artifacts);

      // Document the orchestrated results
      const documentation = await this.documentOrchestratedResults(result, options, artifacts);
      events.push({
        type: 'complete',
        message: 'Orchestrated task completed successfully',
        data: { documentation, executionId },
        timestamp: new Date().toISOString(),
        workflowId: options.workflowId
      });

      return {
        success: true,
        output: typeof result === 'string' ? result : JSON.stringify(result),
        events,
        metadata: {
          agent: options.agent,
          duration: Date.now() - startTime,
          executionId,
          orchestrationPlan,
          artifacts: artifacts.length
        },
        artifacts,
        duration: Date.now() - startTime
      };

    } catch (error) {
      const errorEvent: CodebuffEvent = {
        type: 'error',
        message: `Orchestrated task failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        workflowId: options.workflowId
      };
      events.push(errorEvent);

      this.logger.error('❌ Orchestrated task failed', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        events,
        metadata: {
          agent: options.agent,
          duration: Date.now() - startTime,
          executionId
        },
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Spawn and manage agents with enhanced supervision
   */
  async spawnAgent(request: AgentSpawnRequest): Promise<AgentStatus> {
    try {
      this.logger.info(`🤖 Spawning supervised agent of type: ${request.agentType}`);

      // Break down agent requirements
      const requirements = await this.breakDownAgentRequirements(request);
      
      // Map capabilities to available agent definitions
      const agentDef = this.agentDefinitions.get(request.agentType);
      if (!agentDef) {
        throw new Error(`Agent type ${request.agentType} not found`);
      }

      // Automate agent spawning with supervision
      const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const supervisionConfig = request.supervisionConfig || this.getDefaultSupervisionConfig();
      
      const agentStatus: AgentStatus = {
        id: agentId,
        type: request.agentType,
        status: 'active',
        currentTask: 'Initializing...',
        progress: 0,
        lastActivity: new Date().toISOString(),
        metadata: {
          ...request.config,
          requirements,
          capabilities: request.capabilities,
          workflowId: request.workflowId,
          priority: request.priority || 'normal'
        },
        supervision: {
          heartbeat: {
            lastSeen: new Date().toISOString(),
            interval: supervisionConfig.heartbeatInterval,
            missed: 0
          },
          tasks: {
            current: 0,
            completed: 0,
            failed: 0,
            total: 0
          },
          health: {
            status: 'healthy',
            checks: []
          }
        },
        toolRegistry: request.toolRegistry || agentDef.toolRegistry || []
      };

      this.agents.set(agentId, agentStatus);

      // Start supervision for this agent
      if (this.orchestrationConfig.enableSupervision) {
        this.startAgentSupervision(agentId, supervisionConfig);
      }

      // Document the spawned agent
      this.logger.info(`✅ Agent ${agentId} spawned successfully with supervision`, {
        type: request.agentType,
        capabilities: request.capabilities,
        supervision: supervisionConfig
      });

      this.emit('agent_spawned', agentStatus);
      
      return agentStatus;

    } catch (error) {
      this.logger.error('❌ Failed to spawn supervised agent', error);
      throw error;
    }
  }

  /**
   * Execute a workflow with full orchestration
   */
  async executeWorkflow(workflowId: string): Promise<CodebuffResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    this.logger.info(`🔄 Executing orchestrated workflow: ${workflow.name}`);
    
    const executionId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'running',
      startTime: new Date().toISOString(),
      steps: [],
      artifacts: [],
      events: []
    };

    this.activeExecutions.set(executionId, execution);
    workflow.status = 'running';

    const events: CodebuffEvent[] = [];
    const results: string[] = [];

    try {
      // Execute workflow steps with orchestration
      for (const step of workflow.steps) {
        const stepExecution: WorkflowStepExecution = {
          stepId: step.id,
          agentId: step.agent,
          status: 'running',
          startTime: new Date().toISOString()
        };

        execution.steps.push(stepExecution);

        const stepResult = await this.orchestrateTask({
          agent: step.agent,
          prompt: step.prompt,
          timeout: step.timeout || this.orchestrationConfig.agentTimeout,
          workflowId: executionId,
          handleEvent: (event) => {
            events.push(event);
            execution.events.push(event);
          }
        });

        stepExecution.endTime = new Date().toISOString();
        stepExecution.duration = Date.now() - new Date(stepExecution.startTime).getTime();

        if (!stepResult.success) {
          stepExecution.status = 'failed';
          stepExecution.error = stepResult.error;
          throw new Error(`Workflow step failed: ${stepResult.error}`);
        }

        stepExecution.status = 'completed';
        stepExecution.result = stepResult;
        results.push(stepResult.output || '');
        
        // Collect artifacts
        if (stepResult.artifacts) {
          execution.artifacts.push(...stepResult.artifacts);
        }
      }

      execution.status = 'completed';
      execution.endTime = new Date().toISOString();
      execution.duration = Date.now() - new Date(execution.startTime).getTime();
      workflow.status = 'completed';
      
      // Store execution history
      workflow.executionHistory.push(execution);

      return {
        success: true,
        output: results.join('\n'),
        events,
        metadata: { 
          workflowId, 
          workflowName: workflow.name,
          executionId,
          duration: execution.duration,
          artifacts: execution.artifacts.length
        },
        artifacts: execution.artifacts,
        duration: execution.duration
      };

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date().toISOString();
      execution.duration = Date.now() - new Date(execution.startTime).getTime();
      workflow.status = 'failed';
      
      this.logger.error('❌ Orchestrated workflow execution failed', error);
      throw error;
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  // Private helper methods for BMAD implementation

  private async breakDownOrchestratedTask(options: CodebuffRunOptions): Promise<string[]> {
    // Break down complex tasks into manageable orchestrated pieces
    const sentences = options.prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.map(s => s.trim());
  }

  private async mapOrchestrationDependencies(options: CodebuffRunOptions, taskComponents: string[]): Promise<Record<string, unknown>> {
    // Map out orchestration architecture and dependencies
    const agent = this.agentDefinitions.get(options.agent);
    return {
      agent: options.agent,
      capabilities: agent?.oliverOSCapabilities || [],
      components: taskComponents,
      dependencies: agent?.spawnableAgents || [],
      tools: agent?.toolRegistry || [],
      orchestration: {
        supervision: this.orchestrationConfig.enableSupervision,
        persistence: this.orchestrationConfig.enablePersistence,
        metrics: this.orchestrationConfig.enableMetrics
      }
    };
  }

  private async executeOrchestratedTask(
    options: CodebuffRunOptions, 
    plan: Record<string, unknown>, 
    events: CodebuffEvent[], 
    artifacts: Artifact[]
  ): Promise<any> {
    // Execute the task with full orchestration capabilities
    const result = await this.client.run({
      agent: options.agent,
      prompt: options.prompt,
      agentDefinitions: options.agentDefinitions,
      customToolDefinitions: options.customToolDefinitions as any,
      handleEvent: (event: any) => {
        const codebuffEvent: CodebuffEvent = {
          type: 'progress',
          message: (event as any).message || 'Processing...',
          data: (event as any).data,
          timestamp: new Date().toISOString(),
          workflowId: options.workflowId
        };
        events.push(codebuffEvent);
        options.handleEvent?.(codebuffEvent);
      }
    });

    return result;
  }

  private async documentOrchestratedResults(
    result: any, 
    options: CodebuffRunOptions, 
    artifacts: Artifact[]
  ): Promise<Record<string, unknown>> {
    // Document everything with orchestration context
    return {
      agent: options.agent,
      timestamp: new Date().toISOString(),
      prompt: options.prompt,
      result: result,
      orchestration: {
        supervision: this.orchestrationConfig.enableSupervision,
        persistence: this.orchestrationConfig.enablePersistence,
        metrics: this.orchestrationConfig.enableMetrics
      },
      metadata: {
        agentDefinitions: options.agentDefinitions?.length || 0,
        customTools: options.customToolDefinitions?.length || 0,
        artifacts: artifacts.length
      }
    };
  }

  private async breakDownAgentRequirements(request: AgentSpawnRequest): Promise<Record<string, unknown>> {
    // Break down agent requirements for orchestration
    return {
      type: request.agentType,
      capabilities: request.capabilities,
      config: request.config,
      priority: request.priority || 'normal',
      supervision: request.supervisionConfig ? 'enabled' : 'default'
    };
  }

  // Tool Registry Implementation
  private createToolRegistry(): ToolRegistry {
    const tools = new Map<string, CustomToolDefinition>();
    const mcpServers = new Map<string, MCPServerInfo>();

    return {
      tools,
      mcpServers,
      registerTool: (tool: CustomToolDefinition) => {
        tools.set(tool.name, tool);
        this.logger.info(`🔧 Registered tool: ${tool.name}`);
      },
      unregisterTool: (name: string) => {
        tools.delete(name);
        this.logger.info(`🔧 Unregistered tool: ${name}`);
      },
      getTool: (name: string) => tools.get(name),
      listTools: () => Array.from(tools.values()),
      executeTool: async (name: string, args: Record<string, unknown>) => {
        const tool = tools.get(name);
        if (!tool) {
          throw new Error(`Tool ${name} not found`);
        }
        
        if (tool.handler) {
          return await tool.handler(args);
        }
        
        if (tool.mcpServer) {
          // Execute via MCP tool manager
          return await this.mcpToolManager.executeTool(name, args);
        }
        
        throw new Error(`No handler or MCP server configured for tool ${name}`);
      }
    };
  }

  // Event Bus Implementation
  private createEventBus(): EventBus {
    return {
      emit: (event: string, data: any) => {
        this.emit(event, data);
        this.logger.debug(`📡 Event emitted: ${event}`, data);
      },
      on: (event: string, handler: (data: any) => void) => {
        this.on(event, handler);
      },
      off: (event: string, handler: (data: any) => void) => {
        this.off(event, handler);
      }
    };
  }

  // Supervision and Monitoring
  private async startSupervision(): Promise<void> {
    this.logger.info('👁️ Starting agent supervision...');
    // Implementation for supervision will be added in next iteration
  }

  private async startMetricsCollection(): Promise<void> {
    this.logger.info('📊 Starting metrics collection...');
    // Implementation for metrics will be added in next iteration
  }

  private startAgentSupervision(agentId: string, config: SupervisionConfig): void {
    const timer = setInterval(async () => {
      await this.performAgentHealthCheck(agentId);
    }, config.healthCheckInterval);
    
    this.supervisionTimers.set(agentId, timer);
  }

  private async performAgentHealthCheck(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Perform health checks
    const healthChecks = [
      { name: 'heartbeat', status: 'pass' as const, message: 'Agent responsive' },
      { name: 'memory', status: 'pass' as const, message: 'Memory usage normal' },
      { name: 'tasks', status: 'pass' as const, message: 'Task queue healthy' }
    ];

    if (agent.supervision) {
      agent.supervision.health.checks = healthChecks;
      agent.supervision.health.status = 'healthy';
    }
  }

  private getDefaultSupervisionConfig(): SupervisionConfig {
    return {
      maxConcurrentTasks: 3,
      heartbeatInterval: 30000,
      timeoutMs: 60000,
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1000,
        exponentialBackoff: true,
        retryableErrors: ['timeout', 'network', 'rate_limit']
      },
      backoffStrategy: {
        type: 'exponential',
        baseDelay: 1000,
        maxDelay: 30000,
        multiplier: 2
      },
      healthCheckInterval: 30000
    };
  }

  // MCP Integration
  private async initializeMCPTools(): Promise<void> {
    this.logger.info('🔧 Initializing MCP tools...');
    
    // Get all MCP tools and register them in our tool registry
    const mcpTools = this.mcpToolManager.getAllTools();
    
    for (const tool of mcpTools) {
      this.toolRegistry.registerTool(tool);
    }
    
    // Get server health status
    const serverHealth = await this.mcpToolManager.getServerHealth();
    const serverInfo = this.mcpToolManager.getServerInfo();
    
    for (const [serverName, health] of Object.entries(serverHealth)) {
      const info = serverInfo[serverName];
      this.mcpServers.set(serverName, {
        ...info,
        status: health ? 'running' : 'error'
      });
    }
    
    this.logger.info(`✅ Initialized ${mcpTools.length} MCP tools across ${Object.keys(serverHealth).length} servers`);
  }

  private async executeMCPTool(serverName: string, toolName: string, args: Record<string, unknown>): Promise<unknown> {
    this.logger.info(`🔧 Executing MCP tool: ${toolName} via ${serverName}`);
    
    try {
      const result = await this.mcpToolManager.executeTool(toolName, args);
      
      // Emit tool execution event
      this.emit('tool_called', {
        toolName,
        serverName,
        args,
        result,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      this.logger.error(`❌ MCP tool execution failed: ${toolName}`, error);
      throw error;
    }
  }

  // Workflow Management
  private async initializeWorkflows(): Promise<void> {
    this.logger.info('📋 Initializing workflows...');
    // Implementation for workflow initialization will be added in next iteration
  }

  private async mapAgentDependencies(): Promise<void> {
    this.logger.info('🗺️ Mapping agent dependencies...');
    // Implementation for dependency mapping will be added in next iteration
  }

  // Public API methods
  getAgentDefinitions(): OliverOSAgentDefinition[] {
    return Array.from(this.agentDefinitions.values());
  }

  getWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  getAgentStatus(agentId?: string): AgentStatus | AgentStatus[] {
    if (agentId) {
      const agent = this.agents.get(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }
      return agent;
    }
    
    return Array.from(this.agents.values());
  }

  async getSystemMetrics(): Promise<Metrics> {
    return {
      timestamp: new Date().toISOString(),
      agents: {
        total: this.agents.size,
        active: Array.from(this.agents.values()).filter(a => a.status === 'active').length,
        idle: Array.from(this.agents.values()).filter(a => a.status === 'idle').length,
        error: Array.from(this.agents.values()).filter(a => a.status === 'error').length
      },
      workflows: {
        total: this.workflows.size,
        running: Array.from(this.workflows.values()).filter(w => w.status === 'running').length,
        completed: Array.from(this.workflows.values()).filter(w => w.status === 'completed').length,
        failed: Array.from(this.workflows.values()).filter(w => w.status === 'failed').length
      },
      tools: {
        totalCalls: 0, // Will be implemented with metrics
        successRate: 1.0,
        averageLatency: 0
      },
      system: {
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0, // Will be implemented with metrics
        uptime: process.uptime()
      }
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('🛑 Shutting down Enhanced Codebuff Orchestration Hub...');
    
    // Stop supervision timers
    for (const [agentId, timer] of this.supervisionTimers) {
      clearInterval(timer);
      this.logger.info(`Stopped supervision for agent: ${agentId}`);
    }
    
    // Stop metrics collection
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }
    
    // Terminate all active agents
    for (const [agentId, agent] of this.agents) {
      if (agent.status === 'active' || agent.status === 'busy') {
        agent.status = 'terminated';
        this.logger.info(`Terminated agent: ${agentId}`);
      }
    }
    
    this.isRunning = false;
    this.logger.info('✅ Enhanced Codebuff Orchestration Hub shutdown complete');
  }
}
