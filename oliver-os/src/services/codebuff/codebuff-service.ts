/**
 * Codebuff Service for Oliver-OS
 * Integrates Codebuff SDK with Oliver-OS AI-brain interface system
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { CodebuffClient } from '@codebuff/sdk';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';
import type {
  CodebuffRunOptions,
  CodebuffEvent,
  CodebuffResult,
  CodebuffClientConfig,
  OliverOSAgentDefinition,
  WorkflowDefinition,
  AgentSpawnRequest,
  AgentStatus
} from './types';

export class CodebuffService {
  private client: CodebuffClient;
  private _logger: Logger;
  private _config: Config;
  private agents: Map<string, AgentStatus> = new Map();
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private agentDefinitions: Map<string, OliverOSAgentDefinition> = new Map();

  constructor(config: Config) {
    this._config = config;
    this._logger = new Logger('CodebuffService');
    
    const codebuffConfig: CodebuffClientConfig = {
      apiKey: this._config.get('codebuff.apiKey') || process.env['CODEBUFF_API_KEY'] || '',
      cwd: process.cwd(),
      onError: (error) => this._logger.error('Codebuff client error:', error.message),
      timeout: this._config.get('codebuff.timeout') as number || 300000,
      retries: this._config.get('codebuff.retries') as number || 3
    };

    this.client = new CodebuffClient(codebuffConfig);
    this.initializeAgentDefinitions();
  }

  // Unused - will be implemented in future iteration
  // private _sanitizeConfig(config: any): any {
  //   const sanitized = { ...config };
  //   if (sanitized.apiKey) sanitized.apiKey = '***';
  //   if (sanitized.secret) sanitized.secret = '***';
  //   if (sanitized.token) sanitized.token = '***';
  //   if (sanitized.password) sanitized.password = '***';
  //   return sanitized;
  // }

  /**
   * Initialize Oliver-OS specific agent definitions
   * Following BMAD principles with modular, documented agents
   */
  private initializeAgentDefinitions(): void {
    const agents: OliverOSAgentDefinition[] = [
      {
        id: 'code-generator',
        displayName: 'Code Generator',
        model: 'openai/gpt-4',
        instructionsPrompt: 'Generate high-quality, maintainable code following BMAD principles. Break down complex tasks into manageable pieces, map out architecture and dependencies, automate repetitive processes, and document everything.',
        toolNames: ['read_files', 'write_file', 'search_code'],
        spawnableAgents: ['code-reviewer', 'test-generator'],
        oliverOSCapabilities: ['code-generation', 'architecture-mapping', 'documentation'],
        bmadCompliant: true,
        integrationPoints: ['mcp-server', 'thought-processor', 'collaboration-coordinator'],
        status: 'idle'
      },
      {
        id: 'bureaucracy-disruptor',
        displayName: 'Bureaucracy Disruptor',
        model: 'openai/gpt-4',
        instructionsPrompt: 'Identify and eliminate bureaucratic inefficiencies in code and processes. Focus on automation and streamlining workflows. Break down complex bureaucratic processes into simple, automated solutions.',
        toolNames: ['analyze_processes', 'optimize_workflows', 'automate_tasks'],
        spawnableAgents: ['efficiency-optimizer'],
        oliverOSCapabilities: ['process-analysis', 'workflow-optimization', 'automation'],
        bmadCompliant: true,
        integrationPoints: ['bmad-tools', 'collaboration-coordinator'],
        status: 'idle'
      },
      {
        id: 'thought-processor',
        displayName: 'Thought Processor',
        model: 'openai/gpt-4',
        instructionsPrompt: 'Process and analyze thoughts to extract meaningful insights and patterns. Break down complex thoughts into manageable components, map relationships, and automate insight extraction.',
        toolNames: ['analyze_thought', 'extract_insights', 'generate_summary'],
        spawnableAgents: ['pattern-recognizer', 'knowledge-extractor'],
        oliverOSCapabilities: ['thought-analysis', 'pattern-recognition', 'knowledge-extraction'],
        bmadCompliant: true,
        integrationPoints: ['mcp-server', 'collaboration-coordinator'],
        status: 'idle'
      },
      {
        id: 'collaboration-coordinator',
        displayName: 'Collaboration Coordinator',
        model: 'openai/gpt-4',
        instructionsPrompt: 'Coordinate multiple agents and manage collaborative workflows. Break down complex collaborative tasks, map agent dependencies, automate coordination, and document collaboration patterns.',
        toolNames: ['coordinate_agents', 'manage_workflows', 'resolve_conflicts'],
        spawnableAgents: ['workflow-optimizer', 'conflict-resolver'],
        oliverOSCapabilities: ['agent-coordination', 'workflow-management', 'conflict-resolution'],
        bmadCompliant: true,
        integrationPoints: ['mcp-server', 'all-agents'],
        status: 'idle'
      }
    ];

    agents.forEach(agent => {
      this.agentDefinitions.set(agent.id, agent);
      this.agents.set(agent.id, {
        id: agent.id,
        type: agent.id,
        status: 'idle',
        lastActivity: new Date().toISOString(),
        metadata: {
          capabilities: agent.oliverOSCapabilities,
          bmadCompliant: agent.bmadCompliant,
          integrationPoints: agent.integrationPoints
        }
      });
    });

    this._logger.info(`Initialized ${agents.length} Oliver-OS agent definitions`);
  }

  /**
   * Run a coding task with the specified agent
   * Following BMAD: Break down the task, Map dependencies, Automate execution, Document results
   */
  async runTask(options: CodebuffRunOptions): Promise<CodebuffResult> {
    const events: CodebuffEvent[] = [];
    const startTime = Date.now();

    try {
      this._logger.info(`🚀 Starting Codebuff task with agent: ${options.agent}`);
      
      // Break down the task
      const taskBreakdown = await this.breakDownTask(options.prompt);
      events.push({
        type: 'progress',
        message: 'Task broken down into manageable components',
        data: { breakdown: taskBreakdown },
        timestamp: new Date().toISOString()
      });

      // Map dependencies and prepare execution
      const executionPlan = await this.mapDependencies(options.agent, taskBreakdown);
      events.push({
        type: 'progress',
        message: 'Dependencies mapped and execution plan created',
        data: { plan: executionPlan },
        timestamp: new Date().toISOString()
      });

      // Execute the task
      const result = await this.client.run({
        agent: options.agent,
        prompt: options.prompt,
        customToolDefinitions: options.customToolDefinitions as any,
        handleEvent: ((_event: any) => {
          const codebuffEvent: CodebuffEvent = {
            type: 'progress',
            message: (_event as any).message || 'Processing...',
            data: (_event as any).data,
            timestamp: new Date().toISOString()
          };
          events.push(codebuffEvent);
          options.handleEvent?.(codebuffEvent);
        })
      });

      // Document the results
      const documentation = await this.documentResults(result, options);
      events.push({
        type: 'complete',
        message: 'Task completed successfully',
        data: { documentation },
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        output: typeof result === 'string' ? result : JSON.stringify(result),
        events,
        metadata: {
          agent: options.agent,
          duration: Date.now() - startTime,
          taskBreakdown,
          executionPlan
        }
      };

    } catch (error) {
      const errorEvent: CodebuffEvent = {
        type: 'error',
        message: `Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
      events.push(errorEvent);

      this._logger.error('❌ Codebuff task failed', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        events,
        metadata: {
          agent: options.agent,
          duration: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Spawn a new AI agent with specific capabilities
   * Following BMAD: Break down requirements, Map capabilities, Automate spawning, Document agent
   */
  async spawnAgent(request: AgentSpawnRequest): Promise<AgentStatus> {
    try {
      this._logger.info(`🤖 Spawning agent of type: ${request.agentType}`);

      // Break down agent requirements
      const requirements = await this.breakDownAgentRequirements(request);
      
      // Map capabilities to available agent definitions
      const agentDef = this.agentDefinitions.get(request.agentType);
      if (!agentDef) {
        throw new Error(`Agent type ${request.agentType} not found`);
      }

      // Automate agent spawning
      const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
        }
      };

      this.agents.set(agentId, agentStatus);

      // Document the spawned agent
      this._logger.info(`✅ Agent ${agentId} spawned successfully`, {
        type: request.agentType,
        capabilities: request.capabilities
      });

      return agentStatus;

    } catch (error) {
      this._logger.error('❌ Failed to spawn agent', error);
      throw error;
    }
  }

  /**
   * Get status of all agents or a specific agent
   */
  async getAgentStatus(agentId?: string): Promise<AgentStatus | AgentStatus[]> {
    if (agentId) {
      const agent = this.agents.get(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }
      return agent;
    }
    
    return Array.from(this.agents.values());
  }

  /**
   * Create and manage workflows
   */
  async createWorkflow(definition: WorkflowDefinition): Promise<WorkflowDefinition> {
    this.workflows.set(definition.id, definition);
    this._logger.info(`📋 Created workflow: ${definition.name} (${definition.id})`);
    return definition;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string): Promise<CodebuffResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    this._logger.info(`🔄 Executing workflow: ${workflow.name}`);
    workflow.status = 'running';

    const events: CodebuffEvent[] = [];
    const results: string[] = [];

    try {
      for (const step of workflow.steps) {
        const stepResult = await this.runTask({
          agent: step.agent,
          prompt: step.prompt,
          timeout: step.timeout || 300000,
          handleEvent: (event) => events.push(event)
        });

        if (!stepResult.success) {
          throw new Error(`Workflow step failed: ${stepResult.error}`);
        }

        results.push(stepResult.output || '');
      }

      workflow.status = 'completed';
      return {
        success: true,
        output: results.join('\n'),
        events,
        metadata: { workflowId, workflowName: workflow.name }
      };

    } catch (error) {
      workflow.status = 'failed';
      this._logger.error('❌ Workflow execution failed', error);
      throw error;
    }
  }

  // BMAD Helper Methods

  private async breakDownTask(prompt: string): Promise<string[]> {
    // Break down complex tasks into manageable pieces
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.map(s => s.trim());
  }

  private async mapDependencies(agentId: string, taskComponents: string[]): Promise<Record<string, unknown>> {
    // Map out architecture and dependencies
    const agent = this.agentDefinitions.get(agentId);
    return {
      agent: agentId,
      capabilities: agent?.oliverOSCapabilities || [],
      components: taskComponents,
      dependencies: agent?.spawnableAgents || []
    };
  }

  private async documentResults(result: any, options: CodebuffRunOptions): Promise<Record<string, unknown>> {
    // Document everything
    return {
      agent: options.agent,
      timestamp: new Date().toISOString(),
      prompt: options.prompt,
      result,
      metadata: {
        agentDefinitions: options.agentDefinitions?.length || 0,
        customTools: options.customToolDefinitions?.length || 0
      }
    };
  }

  private async breakDownAgentRequirements(request: AgentSpawnRequest): Promise<Record<string, unknown>> {
    // Break down agent requirements
    return {
      type: request.agentType,
      capabilities: request.capabilities,
      config: request.config,
      priority: request.priority || 'normal'
    };
  }

  /**
   * Get available agent definitions
   */
  getAgentDefinitions(): OliverOSAgentDefinition[] {
    return Array.from(this.agentDefinitions.values());
  }

  /**
   * Get available workflows
   */
  getWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this._logger.info('🛑 Shutting down Codebuff service...');
    
    // Terminate all active agents
    for (const [agentId, agent] of this.agents) {
      if (agent.status === 'active' || agent.status === 'busy') {
        agent.status = 'terminated';
        this._logger.info(`Terminated agent: ${agentId}`);
      }
    }
    
    this._logger.info('✅ Codebuff service shutdown complete');
  }
}
