/**
 * MCP Tools for Codebuff Integration
 * Provides AI models with access to Codebuff agent spawning and management
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { CodebuffService } from '../../services/codebuff/codebuff-service';
import { Logger } from '../../core/logger';
import type { MCPTool } from '../types';
import type { 
  CodebuffRunOptions, 
  AgentSpawnRequest, 
  WorkflowDefinition,
  AgentStatus 
} from '../../services/codebuff/types';

export class CodebuffMCPTools {
  private codebuffService: CodebuffService;
  private logger: Logger;

  constructor(codebuffService: CodebuffService) {
    this.codebuffService = codebuffService;
    this.logger = new Logger('CodebuffMCPTools');
  }

  /**
   * Get all available Codebuff MCP tools
   */
  getTools(): MCPTool[] {
    return [
      {
        name: 'codebuff_run_task',
        description: 'Run a coding task using a Codebuff AI agent',
        inputSchema: {
          type: 'object',
          properties: {
            agent: { 
              type: 'string', 
              description: 'Agent ID to use for the task',
              enum: ['code-generator', 'bureaucracy-disruptor', 'thought-processor', 'collaboration-coordinator']
            },
            prompt: { 
              type: 'string', 
              description: 'The task prompt to execute' 
            },
            timeout: { 
              type: 'number', 
              description: 'Timeout in milliseconds (default: 300000)' 
            },
            retries: { 
              type: 'number', 
              description: 'Number of retry attempts (default: 3)' 
            }
          },
          required: ['agent', 'prompt']
        },
        handler: this.handleRunTask.bind(this)
      },
      {
        name: 'codebuff_spawn_agent',
        description: 'Spawn a new AI agent with specific capabilities',
        inputSchema: {
          type: 'object',
          properties: {
            agentType: { 
              type: 'string', 
              description: 'Type of agent to spawn',
              enum: ['code-generator', 'bureaucracy-disruptor', 'thought-processor', 'collaboration-coordinator']
            },
            capabilities: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'List of capabilities for the agent' 
            },
            config: { 
              type: 'object', 
              description: 'Agent configuration options' 
            },
            priority: { 
              type: 'string', 
              enum: ['low', 'normal', 'high', 'urgent'],
              description: 'Priority level for the agent' 
            }
          },
          required: ['agentType', 'capabilities']
        },
        handler: this.handleSpawnAgent.bind(this)
      },
      {
        name: 'codebuff_get_agent_status',
        description: 'Get status of AI agents and their current tasks',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: { 
              type: 'string', 
              description: 'Specific agent ID to check (optional)' 
            }
          }
        },
        handler: this.handleGetAgentStatus.bind(this)
      },
      {
        name: 'codebuff_create_workflow',
        description: 'Create a new workflow definition for automated agent coordination',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique workflow ID' },
            name: { type: 'string', description: 'Workflow display name' },
            description: { type: 'string', description: 'Workflow description' },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  agent: { type: 'string', description: 'Agent to execute this step' },
                  prompt: { type: 'string', description: 'Prompt for this step' },
                  timeout: { type: 'number', description: 'Timeout for this step' },
                  retries: { type: 'number', description: 'Retry attempts for this step' }
                },
                required: ['agent', 'prompt']
              },
              description: 'List of workflow steps'
            }
          },
          required: ['id', 'name', 'description', 'steps']
        },
        handler: this.handleCreateWorkflow.bind(this)
      },
      {
        name: 'codebuff_execute_workflow',
        description: 'Execute a workflow with multiple agent steps',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: { 
              type: 'string', 
              description: 'ID of the workflow to execute' 
            }
          },
          required: ['workflowId']
        },
        handler: this.handleExecuteWorkflow.bind(this)
      },
      {
        name: 'codebuff_get_agent_definitions',
        description: 'Get all available agent definitions and their capabilities',
        inputSchema: {
          type: 'object',
          properties: {}
        },
        handler: this.handleGetAgentDefinitions.bind(this)
      },
      {
        name: 'codebuff_get_workflows',
        description: 'Get all available workflows',
        inputSchema: {
          type: 'object',
          properties: {}
        },
        handler: this.handleGetWorkflows.bind(this)
      },
      {
        name: 'codebuff_terminate_agent',
        description: 'Terminate a specific agent',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: { 
              type: 'string', 
              description: 'ID of the agent to terminate' 
            }
          },
          required: ['agentId']
        },
        handler: this.handleTerminateAgent.bind(this)
      }
    ];
  }

  // Tool Handlers

  private async handleRunTask(args: Record<string, unknown>): Promise<any> {
    try {
      const { agent, prompt, timeout, retries } = args;
      
      this.logger.info(`🚀 Running Codebuff task with agent: ${agent}`);
      
      const options: CodebuffRunOptions = {
        agent: agent as string,
        prompt: prompt as string,
        timeout: timeout as number || 300000,
        retries: retries as number || 3,
        handleEvent: (event) => {
          this.logger.debug(`Codebuff event: ${event.type} - ${event.message}`);
        }
      };

      const result = await this.codebuffService.runTask(options);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            output: result.output,
            error: result.error,
            events: result.events,
            metadata: result.metadata
          }, null, 2)
        }]
      };

    } catch (error) {
      this.logger.error('❌ Error running Codebuff task', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, null, 2)
        }]
      };
    }
  }

  private async handleSpawnAgent(args: Record<string, unknown>): Promise<any> {
    try {
      const { agentType, capabilities, config, priority } = args;
      
      this.logger.info(`🤖 Spawning agent of type: ${agentType}`);
      
      const request: AgentSpawnRequest = {
        agentType: agentType as string,
        capabilities: capabilities as string[],
        config: config as Record<string, unknown> || {},
        priority: priority as 'low' | 'normal' | 'high' | 'urgent' || 'normal'
      };

      const agent = await this.codebuffService.spawnAgent(request);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            agent: agent
          }, null, 2)
        }]
      };

    } catch (error) {
      this.logger.error('❌ Error spawning agent', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, null, 2)
        }]
      };
    }
  }

  private async handleGetAgentStatus(args: Record<string, unknown>): Promise<any> {
    try {
      const agentId = args['agentId'] as string;
      
      const status = await this.codebuffService.getAgentStatus(agentId);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            status: status
          }, null, 2)
        }]
      };

    } catch (error) {
      this.logger.error('❌ Error getting agent status', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, null, 2)
        }]
      };
    }
  }

  private async handleCreateWorkflow(args: Record<string, unknown>): Promise<any> {
    try {
      const { id, name, description, steps } = args;
      
      this.logger.info(`📋 Creating workflow: ${name}`);
      
      const workflow: WorkflowDefinition = {
        id: id as string,
        name: name as string,
        description: description as string,
        steps: steps as any[],
        agents: [],
        status: 'idle'
      };

      const createdWorkflow = await this.codebuffService.createWorkflow(workflow);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            workflow: createdWorkflow
          }, null, 2)
        }]
      };

    } catch (error) {
      this.logger.error('❌ Error creating workflow', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, null, 2)
        }]
      };
    }
  }

  private async handleExecuteWorkflow(args: Record<string, unknown>): Promise<any> {
    try {
      const workflowId = args['workflowId'] as string;
      
      this.logger.info(`🔄 Executing workflow: ${workflowId}`);
      
      const result = await this.codebuffService.executeWorkflow(workflowId);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            output: result.output,
            error: result.error,
            events: result.events,
            metadata: result.metadata
          }, null, 2)
        }]
      };

    } catch (error) {
      this.logger.error('❌ Error executing workflow', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, null, 2)
        }]
      };
    }
  }

  private async handleGetAgentDefinitions(args: Record<string, unknown>): Promise<any> {
    try {
      const definitions = this.codebuffService.getAgentDefinitions();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            definitions: definitions
          }, null, 2)
        }]
      };

    } catch (error) {
      this.logger.error('❌ Error getting agent definitions', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, null, 2)
        }]
      };
    }
  }

  private async handleGetWorkflows(args: Record<string, unknown>): Promise<any> {
    try {
      const workflows = this.codebuffService.getWorkflows();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            workflows: workflows
          }, null, 2)
        }]
      };

    } catch (error) {
      this.logger.error('❌ Error getting workflows', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, null, 2)
        }]
      };
    }
  }

  private async handleTerminateAgent(args: Record<string, unknown>): Promise<any> {
    try {
      const agentId = args['agentId'] as string;
      
      this.logger.info(`🛑 Terminating agent: ${agentId}`);
      
      // Update agent status to terminated
      const status = await this.codebuffService.getAgentStatus(agentId);
      if (typeof status === 'object' && 'id' in status) {
        (status as AgentStatus).status = 'terminated';
        (status as AgentStatus).lastActivity = new Date().toISOString();
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Agent ${agentId} terminated successfully`
          }, null, 2)
        }]
      };

    } catch (error) {
      this.logger.error('❌ Error terminating agent', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, null, 2)
        }]
      };
    }
  }
}
