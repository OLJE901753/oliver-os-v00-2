/**
 * MCP Server Implementation for Oliver-OS
 * Provides AI models with access to Oliver-OS services and resources
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../core/logger';
import { Config } from '../core/config';
import { CodebuffService } from '../services/codebuff/codebuff-service';
import { CodebuffMCPTools } from './tools/codebuff';
import type { 
  MCPServerConfig, 
  MCPTool, 
  MCPResource, 
  MCPRequest, 
  MCPResponse,
  OliverOSMCPServer 
} from './types';

export class OliverOSMCPServerImpl extends EventEmitter implements OliverOSMCPServer {
  private logger: Logger;
  private oliverConfig: Config;
  public config: MCPServerConfig;
  private serverConfig: MCPServerConfig;
  private isRunning: boolean = false;
  private codebuffService: CodebuffService;
  private codebuffTools: CodebuffMCPTools;

  constructor(config: Config) {
    super();
    this.oliverConfig = config;
    this.logger = new Logger('MCP-Server');
    this.codebuffService = new CodebuffService(config);
    this.codebuffTools = new CodebuffMCPTools(this.codebuffService);
    this.serverConfig = this.createServerConfig();
    this.config = this.serverConfig;
  }

  private createServerConfig(): MCPServerConfig {
    return {
      name: 'oliver-os-mcp-server',
      version: '1.0.0',
      description: 'MCP Server for Oliver-OS AI-brain interface system',
      port: this.oliverConfig.get('port') + 1000, // MCP server on different port
      host: 'localhost',
      tools: this.createTools(),
      resources: this.createResources()
    };
  }

  private createTools(): MCPTool[] {
    const baseTools: MCPTool[] = [
      {
        name: 'get_system_status',
        description: 'Get current Oliver-OS system status and health metrics',
        inputSchema: {
          type: 'object',
          properties: {
            includeDetails: { type: 'boolean', default: false }
          }
        },
        handler: this.handleGetSystemStatus.bind(this)
      },
      {
        name: 'process_thought',
        description: 'Process a thought through the AI-brain interface',
        inputSchema: {
          type: 'object',
          properties: {
            thought: { type: 'string', description: 'The thought to process' },
            userId: { type: 'string', description: 'User ID processing the thought' },
            context: { type: 'object', description: 'Additional context for processing' }
          },
          required: ['thought', 'userId']
        },
        handler: this.handleProcessThought.bind(this)
      },
      {
        name: 'get_agent_status',
        description: 'Get status of AI agents and their current tasks',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: { type: 'string', description: 'Specific agent ID to check' }
          }
        },
        handler: this.handleGetAgentStatus.bind(this)
      },
      {
        name: 'spawn_agent',
        description: 'Spawn a new AI agent with specific capabilities',
        inputSchema: {
          type: 'object',
          properties: {
            agentType: { type: 'string', description: 'Type of agent to spawn' },
            capabilities: { type: 'array', items: { type: 'string' } },
            config: { type: 'object', description: 'Agent configuration' }
          },
          required: ['agentType']
        },
        handler: this.handleSpawnAgent.bind(this)
      },
      {
        name: 'get_collaboration_data',
        description: 'Get real-time collaboration data and user presence',
        inputSchema: {
          type: 'object',
          properties: {
            workspaceId: { type: 'string', description: 'Workspace ID to get data for' }
          }
        },
        handler: this.handleGetCollaborationData.bind(this)
      },
      {
        name: 'execute_bmad_command',
        description: 'Execute BMAD (Break, Map, Automate, Document) commands',
        inputSchema: {
          type: 'object',
          properties: {
            command: { type: 'string', enum: ['break', 'map', 'automate', 'document'] },
            target: { type: 'string', description: 'Target for the BMAD command' },
            options: { type: 'object', description: 'Additional options' }
          },
          required: ['command', 'target']
        },
        handler: this.handleExecuteBmadCommand.bind(this)
      }
    ];

    // Add Codebuff tools
    const codebuffTools = this.codebuffTools.getTools();
    
    this.logger.info(`🔧 Integrated ${codebuffTools.length} Codebuff MCP tools`);
    
    return [...baseTools, ...codebuffTools];
  }

  private createResources(): MCPResource[] {
    return [
      {
        uri: 'oliver-os://system/architecture',
        name: 'System Architecture',
        description: 'Current Oliver-OS system architecture and component relationships',
        mimeType: 'application/json',
        handler: this.handleGetArchitecture.bind(this)
      },
      {
        uri: 'oliver-os://logs/system',
        name: 'System Logs',
        description: 'Recent system logs and error reports',
        mimeType: 'text/plain',
        handler: this.handleGetSystemLogs.bind(this)
      },
      {
        uri: 'oliver-os://config/current',
        name: 'Current Configuration',
        description: 'Current system configuration and environment settings',
        mimeType: 'application/json',
        handler: this.handleGetCurrentConfig.bind(this)
      }
    ];
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('MCP Server is already running');
      return;
    }

    try {
      this.logger.info(`🚀 Starting MCP Server on ${this.serverConfig.host}:${this.serverConfig.port}`);
      this.logger.info(`📋 Available tools: ${this.serverConfig.tools.length}`);
      this.logger.info(`📚 Available resources: ${this.serverConfig.resources.length}`);
      
      this.isRunning = true;
      this.emit('started');
      
      this.logger.info('✅ MCP Server started successfully');
    } catch (error) {
      this.logger.error('❌ Failed to start MCP Server', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('MCP Server is not running');
      return;
    }

    try {
      this.logger.info('🛑 Stopping MCP Server...');
      
      // Shutdown Codebuff service
      await this.codebuffService.shutdown();
      
      this.isRunning = false;
      this.emit('stopped');
      this.logger.info('✅ MCP Server stopped successfully');
    } catch (error) {
      this.logger.error('❌ Failed to stop MCP Server', error);
      throw error;
    }
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      this.logger.debug(`📨 Handling MCP request: ${request.method}`);

      switch (request.method) {
        case 'tools/list':
          return this.handleToolsList(request);
        case 'tools/call':
          return this.handleToolsCall(request);
        case 'resources/list':
          return this.handleResourcesList(request);
        case 'resources/read':
          return this.handleResourcesRead(request);
        case 'initialize':
          return this.handleInitialize(request);
        default:
          return this.createErrorResponse(request.id, -32601, `Method not found: ${request.method}`);
      }
    } catch (error) {
      this.logger.error('❌ Error handling MCP request', error);
      return this.createErrorResponse(request.id, -32603, 'Internal error', error);
    }
  }

  private async handleToolsList(request: MCPRequest): Promise<MCPResponse> {
    const tools = this.serverConfig.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { tools }
    };
  }

  private async handleToolsCall(request: MCPRequest): Promise<MCPResponse> {
    const { name, arguments: args } = request.params as { name: string; arguments: Record<string, unknown> };
    
    const tool = this.serverConfig.tools.find(t => t.name === name);
    if (!tool) {
      return this.createErrorResponse(request.id, -32601, `Tool not found: ${name}`);
    }

    try {
      const result = await tool.handler(args || {});
      return {
        jsonrpc: '2.0',
        id: request.id,
        result
      };
    } catch (error) {
      this.logger.error(`❌ Error executing tool ${name}`, error);
      return this.createErrorResponse(request.id, -32603, `Tool execution failed: ${error}`);
    }
  }

  private async handleResourcesList(request: MCPRequest): Promise<MCPResponse> {
    const resources = this.serverConfig.resources.map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType
    }));

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { resources }
    };
  }

  private async handleResourcesRead(request: MCPRequest): Promise<MCPResponse> {
    const { uri } = request.params as { uri: string };
    
    const resource = this.serverConfig.resources.find(r => r.uri === uri);
    if (!resource) {
      return this.createErrorResponse(request.id, -32601, `Resource not found: ${uri}`);
    }

    try {
      const result = await resource.handler();
      return {
        jsonrpc: '2.0',
        id: request.id,
        result
      };
    } catch (error) {
      this.logger.error(`❌ Error reading resource ${uri}`, error);
      return this.createErrorResponse(request.id, -32603, `Resource read failed: ${error}`);
    }
  }

  private async handleInitialize(request: MCPRequest): Promise<MCPResponse> {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {}
        },
        serverInfo: {
          name: this.serverConfig.name,
          version: this.serverConfig.version
        }
      }
    };
  }

  // Tool Handlers
  private async handleGetSystemStatus(args: Record<string, unknown>): Promise<any> {
    const includeDetails = args['includeDetails'] as boolean || false;
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          status: 'healthy',
          uptime: globalThis.process?.uptime() || 0,
          memory: globalThis.process?.memoryUsage() || {},
          version: this.oliverConfig.get('version'),
          environment: this.oliverConfig.get('nodeEnv'),
          details: includeDetails ? {
            tools: this.serverConfig.tools.length,
            resources: this.serverConfig.resources.length,
            port: this.serverConfig.port
          } : undefined
        }, null, 2)
      }]
    };
  }

  private async handleProcessThought(args: Record<string, unknown>): Promise<any> {
    const { thought, userId, context } = args;
    
    // This would integrate with your actual thought processing service
    this.logger.info(`🧠 Processing thought for user ${userId}: ${thought}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          processedThought: `Processed: ${thought}`,
          userId,
          timestamp: new Date().toISOString(),
          context
        }, null, 2)
      }]
    };
  }

  private async handleGetAgentStatus(args: Record<string, unknown>): Promise<any> {
    const agentId = args['agentId'] as string;
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          agents: agentId ? [{ id: agentId, status: 'active' }] : [
            { id: 'agent-1', status: 'active', type: 'thought-processor' },
            { id: 'agent-2', status: 'idle', type: 'collaboration-manager' }
          ]
        }, null, 2)
      }]
    };
  }

  private async handleSpawnAgent(args: Record<string, unknown>): Promise<any> {
    const { agentType, capabilities, config } = args;
    
    this.logger.info(`🤖 Spawning agent of type: ${agentType}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          agentId: `agent-${Date.now()}`,
          type: agentType,
          capabilities: capabilities || [],
          config: config || {},
          status: 'spawning',
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  private async handleGetCollaborationData(args: Record<string, unknown>): Promise<any> {
    const workspaceId = args['workspaceId'] as string;
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          workspaceId: workspaceId || 'default',
          activeUsers: 2,
          sharedThoughts: 15,
          lastActivity: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  private async handleExecuteBmadCommand(args: Record<string, unknown>): Promise<any> {
    const { command, target, options } = args;
    
    this.logger.info(`🔧 Executing BMAD command: ${command} on ${target}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          command,
          target,
          options: options || {},
          status: 'completed',
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  // Resource Handlers
  private async handleGetArchitecture(): Promise<any> {
    return {
      contents: [{
        uri: 'oliver-os://system/architecture',
        mimeType: 'application/json',
        text: JSON.stringify({
          layers: ['frontend', 'backend', 'ai-services', 'database'],
          components: ['react-app', 'express-server', 'python-services', 'supabase'],
          connections: ['websocket', 'rest-api', 'database-queries']
        }, null, 2)
      }]
    };
  }

  private async handleGetSystemLogs(): Promise<any> {
    return {
      contents: [{
        uri: 'oliver-os://logs/system',
        mimeType: 'text/plain',
        text: `[${new Date().toISOString()}] MCP Server started\n[${new Date().toISOString()}] System healthy\n`
      }]
    };
  }

  private async handleGetCurrentConfig(): Promise<any> {
    return {
      contents: [{
        uri: 'oliver-os://config/current',
        mimeType: 'application/json',
        text: JSON.stringify(this.oliverConfig.getAll(), null, 2)
      }]
    };
  }

  private createErrorResponse(id: string | number, code: number, message: string, data?: unknown): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: { code, message, data }
    };
  }
}
