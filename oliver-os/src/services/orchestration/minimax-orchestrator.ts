/**
 * Minimax M2 Orchestrator for TypeScript/Node.js
 * Inspired by CodeBuff patterns - Multi-agent orchestration using Minimax M2
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';
import { MinimaxProvider } from '../llm/minimax-provider';
import type { AgentDefinition, WorkflowDefinition, WorkflowStep } from '../codebuff/types';

export enum AgentStatus {
  IDLE = 'idle',
  STARTING = 'starting',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  STOPPED = 'stopped'
}

export interface SpawnRequest {
  agentType: string;
  prompt: string;
  metadata?: Record<string, unknown>;
}

export interface SpawnedAgent {
  id: string;
  agentType: string;
  prompt: string;
  status: AgentStatus;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  metadata: Record<string, unknown>;
  result?: unknown;
  error?: string;
  llmProvider?: string;
}

export interface SupervisionMetrics {
  agentId: string;
  status: AgentStatus;
  lastHeartbeat: Date;
  heartbeatInterval: number;
  missedHeartbeats: number;
  tasksCompleted: number;
  tasksFailed: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

export interface OrchestrationMetrics {
  agents: {
    total: number;
    active: number;
    completed: number;
    failed: number;
    idle: number;
  };
  workflows: {
    total: number;
    running: number;
    completed: number;
    failed: number;
  };
  performance: {
    avgDurationMs: number;
    totalDurationMs: number;
  };
  supervision: {
    agentsMonitored: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

export class MinimaxOrchestrator extends EventEmitter {
  private agents: Map<string, AgentDefinition> = new Map();
  private spawnedAgents: Map<string, SpawnedAgent> = new Map();
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private minimaxProvider: MinimaxProvider;
  private supervisionMetrics: Map<string, SupervisionMetrics> = new Map();
  private logger: Logger;
  private configPath: string;
  private maxConcurrentAgents: number = 10;
  private supervisionEnabled: boolean = true;
  private metricsEnabled: boolean = true;
  private supervisionTimer?: NodeJS.Timeout;
  private metricsTimer?: NodeJS.Timeout;

  constructor(config: Config) {
    super();
    this.logger = new Logger('MinimaxOrchestrator');
    this.configPath = path.join(process.cwd(), 'codebuff-config.json');

    // Initialize Minimax provider
    const minimaxConfig = config.get('minimax') as {
      apiKey: string;
      baseURL: string;
      model: string;
      temperature: number;
      maxTokens: number;
    };

    this.minimaxProvider = new MinimaxProvider({
      apiKey: minimaxConfig.apiKey || process.env['MINIMAX_API_KEY'] || '',
      baseURL: minimaxConfig.baseURL || 'https://api.minimax.io/v1',
      model: minimaxConfig.model || 'MiniMax-M2',
      temperature: minimaxConfig.temperature || 0.7,
      maxTokens: minimaxConfig.maxTokens || 1024
    });
  }

  async initialize(): Promise<void> {
    this.logger.info('🚀 Initializing Minimax M2 Orchestrator...');

    // Load agent definitions from codebuff-config.json
    await this.loadAgentDefinitions();

    // Load workflow definitions
    await this.loadWorkflows();

    // Start supervision if enabled
    if (this.supervisionEnabled) {
      await this.startSupervision();
    }

    // Start metrics collection if enabled
    if (this.metricsEnabled) {
      await this.startMetricsCollection();
    }

    this.logger.info(`✅ Minimax Orchestrator initialized with ${this.agents.size} agent types`);
    this.logger.info(`📋 Loaded ${this.workflows.size} workflows`);
  }

  private async loadAgentDefinitions(): Promise<void> {
    try {
      if (!(await fs.pathExists(this.configPath))) {
        this.logger.warn(`⚠️ Config file not found: ${this.configPath}`);
        await this.registerFallbackAgents();
        return;
      }

      const configContent = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(configContent);
      const agentsConfig = config.agents || {};

      for (const [agentId, agentData] of Object.entries(agentsConfig)) {
        const agent = agentData as any;
        const modelStr = agent.model || 'minimax/MiniMax-M2';
        const provider = modelStr.split('/')[0] || 'minimax';

        const agentDef: AgentDefinition = {
          id: agentId,
          displayName: agent.displayName || agentId,
          model: modelStr,
          instructionsPrompt: agent.instructionsPrompt || '',
          toolNames: agent.toolNames || [],
          spawnableAgents: agent.spawnableAgents || [],
          status: 'idle',
          metadata: { provider }
        };

        this.agents.set(agentId, agentDef);
      }

      this.logger.info(`📝 Loaded ${this.agents.size} agent definitions from config`);
    } catch (error) {
      this.logger.error(`❌ Failed to load agent definitions: ${error}`);
      await this.registerFallbackAgents();
    }
  }

  private async registerFallbackAgents(): Promise<void> {
    const fallbackAgents: AgentDefinition[] = [
      {
        id: 'thought-processor',
        displayName: 'Thought Processor',
        model: 'minimax/MiniMax-M2',
        toolNames: ['analyze_thought', 'extract_insights', 'generate_summary'],
        spawnableAgents: ['pattern-recognizer', 'knowledge-extractor'],
        instructionsPrompt: 'Process and analyze thoughts to extract meaningful insights and patterns.',
        status: 'idle'
      },
      {
        id: 'code-generator',
        displayName: 'Code Generator',
        model: 'minimax/MiniMax-M2',
        toolNames: ['generate_code', 'review_code', 'optimize_code'],
        spawnableAgents: ['test-generator', 'documentation-generator'],
        instructionsPrompt: 'Generate high-quality, maintainable code following BMAD principles.',
        status: 'idle'
      }
    ];

    for (const agent of fallbackAgents) {
      this.agents.set(agent.id, agent);
    }
  }

  private async loadWorkflows(): Promise<void> {
    try {
      if (!(await fs.pathExists(this.configPath))) {
        return;
      }

      const configContent = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(configContent);
      const workflowsConfig = config.workflows || {};

      for (const [workflowId, workflowData] of Object.entries(workflowsConfig)) {
        const workflow = workflowData as any;
        const steps: WorkflowStep[] = [];
        const agents: string[] = [];

        for (let idx = 0; idx < (workflow.steps || []).length; idx++) {
          const stepData = workflow.steps[idx];
          const step: WorkflowStep = {
            id: `${workflowId}-step-${idx}`,
            agent: stepData.agent || '',
            prompt: stepData.prompt || '',
            dependencies: stepData.dependencies || [],
            timeout: workflow.settings?.defaultTimeout || 300000,
            retries: workflow.settings?.retryAttempts || 3
          };
          steps.push(step);
          if (step.agent && !agents.includes(step.agent)) {
            agents.push(step.agent);
          }
        }

        const workflowDef: WorkflowDefinition = {
          id: workflowId,
          name: workflow.name || workflowId,
          description: workflow.description || '',
          steps,
          agents,
          status: 'idle',
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          executionHistory: []
        };

        this.workflows.set(workflowId, workflowDef);
      }

      this.logger.info(`📋 Loaded ${this.workflows.size} workflow definitions`);
    } catch (error) {
      this.logger.error(`❌ Failed to load workflows: ${error}`);
    }
  }

  async spawnAgent(request: SpawnRequest): Promise<SpawnedAgent> {
    const agentDef = this.agents.get(request.agentType);
    if (!agentDef) {
      throw new Error(`Agent type ${request.agentType} not found`);
    }

    // Check concurrent agent limit
    const activeCount = Array.from(this.spawnedAgents.values()).filter(
      a => a.status === AgentStatus.RUNNING
    ).length;
    if (activeCount >= this.maxConcurrentAgents) {
      throw new Error(`Max concurrent agents (${this.maxConcurrentAgents}) reached`);
    }

    const agentId = `${request.agentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();

    const spawnedAgent: SpawnedAgent = {
      id: agentId,
      agentType: request.agentType,
      prompt: request.prompt,
      status: AgentStatus.STARTING,
      startTime,
      metadata: request.metadata || {}
    };

    this.spawnedAgents.set(agentId, spawnedAgent);

    // Initialize supervision metrics
    if (this.supervisionEnabled) {
      this.supervisionMetrics.set(agentId, {
        agentId,
        status: AgentStatus.STARTING,
        lastHeartbeat: new Date(),
        heartbeatInterval: 30,
        missedHeartbeats: 0,
        tasksCompleted: 0,
        tasksFailed: 0,
        healthStatus: 'healthy'
      });
    }

    this.logger.info(`🚀 Spawning agent: ${agentDef.displayName} (${agentId})`);

    try {
      // Execute agent logic with Minimax M2
      const result = await this.executeAgent(spawnedAgent, agentDef);

      spawnedAgent.status = AgentStatus.COMPLETED;
      spawnedAgent.result = result;
      spawnedAgent.endTime = new Date();
      spawnedAgent.durationMs = spawnedAgent.endTime.getTime() - startTime.getTime();

      // Update supervision metrics
      const metrics = this.supervisionMetrics.get(agentId);
      if (metrics) {
        metrics.status = AgentStatus.COMPLETED;
        metrics.tasksCompleted += 1;
      }

      this.logger.info(`✅ Agent completed: ${agentDef.displayName} (${agentId}) in ${spawnedAgent.durationMs}ms`);

      this.emit('agent_completed', spawnedAgent);
    } catch (error) {
      spawnedAgent.status = AgentStatus.FAILED;
      spawnedAgent.error = error instanceof Error ? error.message : String(error);
      spawnedAgent.endTime = new Date();

      // Update supervision metrics
      const metrics = this.supervisionMetrics.get(agentId);
      if (metrics) {
        metrics.status = AgentStatus.FAILED;
        metrics.tasksFailed += 1;
        metrics.healthStatus = 'unhealthy';
      }

      this.logger.error(`❌ Agent failed: ${agentDef.displayName} (${agentId}) - ${error}`);
      this.emit('agent_failed', spawnedAgent);
    }

    return spawnedAgent;
  }

  private async executeAgent(agent: SpawnedAgent, agentDef: AgentDefinition): Promise<unknown> {
    agent.status = AgentStatus.RUNNING;

    // Update supervision metrics
    const metrics = this.supervisionMetrics.get(agent.id);
    if (metrics) {
      metrics.status = AgentStatus.RUNNING;
      metrics.lastHeartbeat = new Date();
    }

    agent.llmProvider = 'minimax';

    // Build full prompt with agent instructions
    const fullPrompt = `${agentDef.instructionsPrompt}

Task: ${agent.prompt}

Please provide a structured response following BMAD principles:
- Break down the task into manageable components
- Map out dependencies and relationships
- Automate repetitive aspects where possible
- Document your approach and findings

Response:`;

    try {
      // Use Minimax M2 to generate response
      const response = await this.minimaxProvider.generate(fullPrompt);

      // Parse and structure the response
      const result = this.parseAgentResponse(agentDef, response, agent);

      return result;
    } catch (error) {
      this.logger.error(`❌ LLM execution failed for agent ${agentDef.id}: ${error}`);
      throw error;
    }
  }

  private parseAgentResponse(agentDef: AgentDefinition, response: string, agent: SpawnedAgent): Record<string, unknown> {
    const result: Record<string, unknown> = {
      agentId: agentDef.id,
      agentType: agentDef.displayName,
      rawResponse: response,
      timestamp: new Date().toISOString(),
      llmProvider: agent.llmProvider
    };

    // Agent-specific parsing
    if (agentDef.id === 'thought-processor') {
      result['insights'] = this.extractInsights(response);
      result['relatedTopics'] = this.extractTopics(response);
      result['spawnedAgents'] = agentDef.spawnableAgents;
    } else if (agentDef.id === 'code-generator') {
      result['generatedCode'] = this.extractCode(response);
      result['recommendations'] = this.extractRecommendations(response);
    } else {
      result['structuredResponse'] = response;
    }

    return result;
  }

  private extractInsights(response: string): Array<{ type: string; content: string }> {
    const lines = response.split('\n');
    const insights: Array<{ type: string; content: string }> = [];
    for (const line of lines) {
      if (line.trim() && (line.toLowerCase().includes('insight') || line.toLowerCase().includes('key') || line.toLowerCase().includes('finding'))) {
        insights.push({ type: 'insight', content: line.trim() });
      }
    }
    return insights.slice(0, 5);
  }

  private extractTopics(response: string): string[] {
    const topics: string[] = [];
    for (const word of response.split(/\s+/)) {
      if (word.startsWith('#') || word === word.toUpperCase()) {
        topics.push(word.replace('#', '').toLowerCase());
      }
    }
    return topics.slice(0, 10);
  }

  private extractCode(response: string): { blocks: string[]; count: number; totalLines: number } {
    const codeBlocks: string[] = [];
    let inCodeBlock = false;
    const currentCode: string[] = [];

    for (const line of response.split('\n')) {
      if (line.includes('```')) {
        if (inCodeBlock) {
          codeBlocks.push(currentCode.join('\n'));
          currentCode.length = 0;
        }
        inCodeBlock = !inCodeBlock;
      } else if (inCodeBlock) {
        currentCode.push(line);
      }
    }

    return {
      blocks: codeBlocks,
      count: codeBlocks.length,
      totalLines: codeBlocks.reduce((sum, block) => sum + block.split('\n').length, 0)
    };
  }

  private extractRecommendations(response: string): string[] {
    const recommendations: string[] = [];
    const lines = response.split('\n');
    for (const line of lines) {
      if (['recommend', 'suggest', 'should', 'consider'].some(keyword => line.toLowerCase().includes(keyword))) {
        recommendations.push(line.trim());
      }
    }
    return recommendations.slice(0, 5);
  }

  async executeWorkflow(workflowId: string, _initialPrompt: string, metadata?: Record<string, unknown>): Promise<Record<string, unknown>> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    workflow.status = 'running';
    this.logger.info(`🎯 Starting workflow: ${workflow.name} (${workflowId})`);

    const results: Record<string, unknown> = {};
    const stepResults: Record<string, unknown> = {};

    try {
      for (const step of workflow.steps) {
        // Check dependencies
        if (step.dependencies) {
          for (const depId of step.dependencies) {
            if (!(depId in stepResults)) {
              throw new Error(`Dependency ${depId} not completed`);
            }
          }
        }

        // Build prompt with previous step results
        let stepPrompt = step.prompt;
        if (Object.keys(stepResults).length > 0) {
          const context = Object.entries(stepResults)
            .map(([sid, res]) => `Step ${sid}: ${JSON.stringify(res)}`)
            .join('\n');
          stepPrompt = `${stepPrompt}\n\nContext from previous steps:\n${context}`;
        }

        // Spawn agent for this step
        const stepMetadata = { ...metadata };
        stepMetadata['workflow_id'] = workflowId;
        stepMetadata['step_id'] = step.id;

        const spawnedAgent = await this.spawnAgent({
          agentType: step.agent,
          prompt: stepPrompt,
          metadata: stepMetadata
        });

        stepResults[step.id] = spawnedAgent.result;
        results[step.id] = {
          agentId: spawnedAgent.id,
          status: spawnedAgent.status,
          result: spawnedAgent.result,
          durationMs: spawnedAgent.durationMs
        };

        // Check if step failed
        if (spawnedAgent.status === AgentStatus.FAILED) {
          workflow.status = 'failed';
          throw new Error(`Workflow step ${step.id} failed: ${spawnedAgent.error}`);
        }
      }

      workflow.status = 'completed';
      this.logger.info(`✅ Workflow completed: ${workflow.name}`);

      return {
        workflowId,
        status: 'completed',
        results,
        durationMs: Object.values(results).reduce((sum: number, r: any) => sum + (r.durationMs || 0), 0)
      };
    } catch (error) {
      workflow.status = 'failed';
      this.logger.error(`❌ Workflow failed: ${workflow.name} - ${error}`);
      return {
        workflowId,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        results
      };
    }
  }

  private async startSupervision(): Promise<void> {
    if (!this.supervisionEnabled) {
      return;
    }

    this.logger.info('🔍 Starting agent supervision...');
    this.supervisionTimer = setInterval(() => {
      this.checkAgentHealth();
    }, 30000); // Check every 30 seconds
  }

  private checkAgentHealth(): void {
    const now = new Date();
    for (const [agentId, metrics] of this.supervisionMetrics.entries()) {
      if (metrics.status === AgentStatus.RUNNING) {
        const timeSinceHeartbeat = (now.getTime() - metrics.lastHeartbeat.getTime()) / 1000;

        if (timeSinceHeartbeat > metrics.heartbeatInterval * 2) {
          metrics.missedHeartbeats += 1;
          metrics.healthStatus = 'degraded';

          if (metrics.missedHeartbeats > 3) {
            metrics.healthStatus = 'unhealthy';
            const agent = this.spawnedAgents.get(agentId);
            if (agent) {
              agent.status = AgentStatus.FAILED;
              agent.error = 'Agent health check failed - missed too many heartbeats';
              this.logger.warn(`⚠️ Agent ${agentId} marked as unhealthy`);
            }
          }
        }
      }
    }
  }

  private async startMetricsCollection(): Promise<void> {
    if (!this.metricsEnabled) {
      return;
    }

    this.logger.info('📊 Starting metrics collection...');
    this.metricsTimer = setInterval(() => {
      const metrics = this.getMetrics();
      this.logger.info(`📊 Metrics: ${JSON.stringify(metrics)}`);
    }, 60000); // Collect metrics every minute
  }

  getMetrics(): OrchestrationMetrics {
    const spawnedAgentsArray = Array.from(this.spawnedAgents.values());
    const activeAgents = spawnedAgentsArray.filter(a => a.status === AgentStatus.RUNNING).length;
    const completedAgents = spawnedAgentsArray.filter(a => a.status === AgentStatus.COMPLETED).length;
    const failedAgents = spawnedAgentsArray.filter(a => a.status === AgentStatus.FAILED).length;

    const totalDuration = spawnedAgentsArray
      .filter(a => a.durationMs !== undefined)
      .reduce((sum, a) => sum + (a.durationMs || 0), 0);

    const avgDuration = spawnedAgentsArray.length > 0 ? totalDuration / spawnedAgentsArray.length : 0;

    const workflowsArray = Array.from(this.workflows.values());
    const supervisionMetricsArray = Array.from(this.supervisionMetrics.values());

    return {
      agents: {
        total: spawnedAgentsArray.length,
        active: activeAgents,
        completed: completedAgents,
        failed: failedAgents,
        idle: spawnedAgentsArray.length - activeAgents - completedAgents - failedAgents
      },
      workflows: {
        total: workflowsArray.length,
        running: workflowsArray.filter(w => w.status === 'running').length,
        completed: workflowsArray.filter(w => w.status === 'completed').length,
        failed: workflowsArray.filter(w => w.status === 'failed').length
      },
      performance: {
        avgDurationMs: avgDuration,
        totalDurationMs: totalDuration
      },
      supervision: {
        agentsMonitored: supervisionMetricsArray.length,
        healthy: supervisionMetricsArray.filter(m => m.healthStatus === 'healthy').length,
        degraded: supervisionMetricsArray.filter(m => m.healthStatus === 'degraded').length,
        unhealthy: supervisionMetricsArray.filter(m => m.healthStatus === 'unhealthy').length
      }
    };
  }

  getAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  getWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  async shutdown(): Promise<void> {
    this.logger.info('🛑 Shutting down Minimax Orchestrator...');

    // Stop supervision and metrics timers
    if (this.supervisionTimer) {
      clearInterval(this.supervisionTimer);
    }
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }

    // Stop all running agents
    const runningAgents = Array.from(this.spawnedAgents.values()).filter(
      a => a.status === AgentStatus.RUNNING
    );

    for (const agent of runningAgents) {
      agent.status = AgentStatus.STOPPED;
    }

    this.logger.info('✅ Minimax Orchestrator shutdown complete');
  }
}
