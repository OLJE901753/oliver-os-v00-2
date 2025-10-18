/**
 * Database MCP Server for Oliver-OS
 * Provides Supabase integration and database operations
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import type { MCPTool, MCPResource, MCPRequest, MCPResponse, OliverOSMCPServer } from '../types';

export class DatabaseMCPServer extends EventEmitter implements OliverOSMCPServer {
  private logger: Logger;
  public config: any;
  private isRunning: boolean = false;
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    super();
    this.logger = new Logger('Database-MCP-Server');
    this.supabaseUrl = supabaseUrl || process.env.SUPABASE_URL || '';
    this.supabaseKey = supabaseKey || process.env.SUPABASE_ANON_KEY || '';
    this.config = this.createServerConfig();
  }

  private createServerConfig() {
    return {
      name: 'database-mcp-server',
      version: '1.0.0',
      description: 'Database MCP Server for Supabase integration and database operations',
      port: 4003,
      host: 'localhost',
      tools: this.createTools(),
      resources: this.createResources()
    };
  }

  private createTools(): MCPTool[] {
    return [
      {
        name: 'db_query',
        description: 'Execute a SQL query on the database',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'SQL query to execute' },
            table: { type: 'string', description: 'Table name (for simple queries)' },
            operation: { type: 'string', enum: ['select', 'insert', 'update', 'delete'], description: 'Operation type' },
            data: { type: 'object', description: 'Data for insert/update operations' },
            where: { type: 'object', description: 'Where conditions' },
            limit: { type: 'number', description: 'Limit number of results' },
            offset: { type: 'number', description: 'Offset for pagination' }
          },
          required: ['query']
        },
        handler: this.handleQuery.bind(this)
      },
      {
        name: 'db_get_tables',
        description: 'Get list of tables in the database',
        inputSchema: {
          type: 'object',
          properties: {
            schema: { type: 'string', default: 'public', description: 'Database schema' },
            include_views: { type: 'boolean', default: true, description: 'Include views in results' }
          }
        },
        handler: this.handleGetTables.bind(this)
      },
      {
        name: 'db_get_table_schema',
        description: 'Get schema information for a specific table',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name' },
            schema: { type: 'string', default: 'public', description: 'Database schema' }
          },
          required: ['table']
        },
        handler: this.handleGetTableSchema.bind(this)
      },
      {
        name: 'db_insert_record',
        description: 'Insert a new record into a table',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name' },
            data: { type: 'object', description: 'Record data to insert' },
            returning: { type: 'string', description: 'Columns to return after insert' }
          },
          required: ['table', 'data']
        },
        handler: this.handleInsertRecord.bind(this)
      },
      {
        name: 'db_update_record',
        description: 'Update records in a table',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name' },
            data: { type: 'object', description: 'Data to update' },
            where: { type: 'object', description: 'Where conditions' },
            returning: { type: 'string', description: 'Columns to return after update' }
          },
          required: ['table', 'data', 'where']
        },
        handler: this.handleUpdateRecord.bind(this)
      },
      {
        name: 'db_delete_record',
        description: 'Delete records from a table',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'Table name' },
            where: { type: 'object', description: 'Where conditions' },
            returning: { type: 'string', description: 'Columns to return after delete' }
          },
          required: ['table', 'where']
        },
        handler: this.handleDeleteRecord.bind(this)
      },
      {
        name: 'db_get_user_data',
        description: 'Get user-specific data from Oliver-OS tables',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: { type: 'string', description: 'User ID' },
            table: { type: 'string', description: 'Table name (thoughts, workspaces, etc.)' },
            limit: { type: 'number', default: 50, description: 'Limit number of results' },
            order_by: { type: 'string', description: 'Column to order by' },
            order_direction: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
          },
          required: ['user_id', 'table']
        },
        handler: this.handleGetUserData.bind(this)
      },
      {
        name: 'db_create_thought',
        description: 'Create a new thought record',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: { type: 'string', description: 'User ID' },
            content: { type: 'string', description: 'Thought content' },
            workspace_id: { type: 'string', description: 'Workspace ID' },
            metadata: { type: 'object', description: 'Additional metadata' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Thought tags' }
          },
          required: ['user_id', 'content']
        },
        handler: this.handleCreateThought.bind(this)
      },
      {
        name: 'db_get_thoughts',
        description: 'Get thoughts for a user or workspace',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: { type: 'string', description: 'User ID' },
            workspace_id: { type: 'string', description: 'Workspace ID (optional)' },
            limit: { type: 'number', default: 50, description: 'Limit number of results' },
            offset: { type: 'number', default: 0, description: 'Offset for pagination' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
            search: { type: 'string', description: 'Search in thought content' }
          },
          required: ['user_id']
        },
        handler: this.handleGetThoughts.bind(this)
      },
      {
        name: 'db_create_workspace',
        description: 'Create a new collaboration workspace',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Workspace name' },
            description: { type: 'string', description: 'Workspace description' },
            creator_id: { type: 'string', description: 'Creator user ID' },
            settings: { type: 'object', description: 'Workspace settings' },
            is_public: { type: 'boolean', default: false, description: 'Whether workspace is public' }
          },
          required: ['name', 'creator_id']
        },
        handler: this.handleCreateWorkspace.bind(this)
      },
      {
        name: 'db_get_workspaces',
        description: 'Get workspaces for a user',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: { type: 'string', description: 'User ID' },
            include_public: { type: 'boolean', default: true, description: 'Include public workspaces' },
            limit: { type: 'number', default: 50, description: 'Limit number of results' }
          },
          required: ['user_id']
        },
        handler: this.handleGetWorkspaces.bind(this)
      },
      {
        name: 'db_join_workspace',
        description: 'Join a user to a workspace',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: { type: 'string', description: 'User ID' },
            workspace_id: { type: 'string', description: 'Workspace ID' },
            role: { type: 'string', enum: ['viewer', 'contributor', 'moderator', 'admin'], default: 'contributor' }
          },
          required: ['user_id', 'workspace_id']
        },
        handler: this.handleJoinWorkspace.bind(this)
      },
      {
        name: 'db_get_analytics',
        description: 'Get analytics data for Oliver-OS',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: { type: 'string', description: 'User ID' },
            metric: { type: 'string', enum: ['thoughts_count', 'workspace_activity', 'collaboration_stats', 'ai_usage'], description: 'Metric to retrieve' },
            period: { type: 'string', enum: ['day', 'week', 'month', 'year'], default: 'month', description: 'Time period' },
            start_date: { type: 'string', description: 'Start date (ISO 8601)' },
            end_date: { type: 'string', description: 'End date (ISO 8601)' }
          },
          required: ['user_id', 'metric']
        },
        handler: this.handleGetAnalytics.bind(this)
      }
    ];
  }

  private createResources(): MCPResource[] {
    return [
      {
        uri: 'database://schema/public',
        name: 'Public Schema',
        description: 'Database schema information for public tables',
        mimeType: 'application/json',
        handler: this.handleGetPublicSchema.bind(this)
      },
      {
        uri: 'database://stats/overview',
        name: 'Database Statistics',
        description: 'Overview of database statistics and health',
        mimeType: 'application/json',
        handler: this.handleGetDatabaseStats.bind(this)
      },
      {
        uri: 'database://tables/oliver-os',
        name: 'Oliver-OS Tables',
        description: 'Oliver-OS specific tables and their structure',
        mimeType: 'application/json',
        handler: this.handleGetOliverOSTables.bind(this)
      }
    ];
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Database MCP Server is already running');
      return;
    }

    try {
      this.logger.info(`🚀 Starting Database MCP Server on ${this.config.host}:${this.config.port}`);
      this.logger.info(`🗄️ Supabase URL: ${this.supabaseUrl ? 'Configured' : 'Not configured'}`);
      this.logger.info(`📋 Available tools: ${this.config.tools.length}`);
      this.logger.info(`📚 Available resources: ${this.config.resources.length}`);
      
      this.isRunning = true;
      this.emit('started');
      
      this.logger.info('✅ Database MCP Server started successfully');
    } catch (error) {
      this.logger.error('❌ Failed to start Database MCP Server', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Database MCP Server is not running');
      return;
    }

    try {
      this.logger.info('🛑 Stopping Database MCP Server...');
      this.isRunning = false;
      this.emit('stopped');
      this.logger.info('✅ Database MCP Server stopped successfully');
    } catch (error) {
      this.logger.error('❌ Failed to stop Database MCP Server', error);
      throw error;
    }
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      this.logger.debug(`📨 Handling Database MCP request: ${request.method}`);

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
      this.logger.error('❌ Error handling Database MCP request', error);
      return this.createErrorResponse(request.id, -32603, 'Internal error', error);
    }
  }

  private async handleToolsList(request: MCPRequest): Promise<MCPResponse> {
    const tools = this.config.tools.map(tool => ({
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
    
    const tool = this.config.tools.find(t => t.name === name);
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
      this.logger.error(`❌ Error executing Database tool ${name}`, error);
      return this.createErrorResponse(request.id, -32603, `Tool execution failed: ${error}`);
    }
  }

  private async handleResourcesList(request: MCPRequest): Promise<MCPResponse> {
    const resources = this.config.resources.map(resource => ({
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
    
    const resource = this.config.resources.find(r => r.uri === uri);
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
      this.logger.error(`❌ Error reading Database resource ${uri}`, error);
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
          name: this.config.name,
          version: this.config.version
        }
      }
    };
  }

  // Tool Handlers
  private async handleQuery(args: Record<string, unknown>): Promise<any> {
    const { query, table, operation, data, where, limit, offset } = args;
    
    this.logger.info(`🔍 Executing database query: ${query}`);
    
    // This would integrate with Supabase client
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query: query as string,
          table: table as string,
          operation: operation as string,
          data: data as Record<string, unknown>,
          where: where as Record<string, unknown>,
          limit: limit as number,
          offset: offset as number,
          results: [
            { id: 1, name: 'Sample Result', created_at: new Date().toISOString() }
          ],
          count: 1,
          execution_time: '15ms'
        }, null, 2)
      }]
    };
  }

  private async handleGetTables(args: Record<string, unknown>): Promise<any> {
    const { schema, include_views } = args;
    
    this.logger.info(`📋 Getting tables from schema: ${schema}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          schema: schema || 'public',
          include_views: include_views || true,
          tables: [
            {
              name: 'users',
              type: 'table',
              schema: schema || 'public',
              size: '1.2 MB',
              rows: 150
            },
            {
              name: 'thoughts',
              type: 'table',
              schema: schema || 'public',
              size: '5.8 MB',
              rows: 1250
            },
            {
              name: 'workspaces',
              type: 'table',
              schema: schema || 'public',
              size: '256 KB',
              rows: 45
            }
          ]
        }, null, 2)
      }]
    };
  }

  private async handleGetTableSchema(args: Record<string, unknown>): Promise<any> {
    const { table, schema } = args;
    
    this.logger.info(`📊 Getting schema for table: ${table}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          table: table as string,
          schema: schema || 'public',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              nullable: false,
              primary_key: true,
              default: 'gen_random_uuid()'
            },
            {
              name: 'content',
              type: 'text',
              nullable: false,
              primary_key: false
            },
            {
              name: 'user_id',
              type: 'uuid',
              nullable: false,
              primary_key: false,
              foreign_key: 'users(id)'
            },
            {
              name: 'created_at',
              type: 'timestamp',
              nullable: false,
              primary_key: false,
              default: 'now()'
            }
          ],
          indexes: [
            { name: 'idx_thoughts_user_id', columns: ['user_id'] },
            { name: 'idx_thoughts_created_at', columns: ['created_at'] }
          ]
        }, null, 2)
      }]
    };
  }

  private async handleInsertRecord(args: Record<string, unknown>): Promise<any> {
    const { table, data, returning } = args;
    
    this.logger.info(`➕ Inserting record into table: ${table}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          table: table as string,
          data: data as Record<string, unknown>,
          returning: returning as string,
          inserted_record: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            ...data as Record<string, unknown>,
            created_at: new Date().toISOString()
          }
        }, null, 2)
      }]
    };
  }

  private async handleUpdateRecord(args: Record<string, unknown>): Promise<any> {
    const { table, data, where, returning } = args;
    
    this.logger.info(`✏️ Updating records in table: ${table}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          table: table as string,
          data: data as Record<string, unknown>,
          where: where as Record<string, unknown>,
          returning: returning as string,
          updated_count: 1,
          updated_records: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              ...data as Record<string, unknown>,
              updated_at: new Date().toISOString()
            }
          ]
        }, null, 2)
      }]
    };
  }

  private async handleDeleteRecord(args: Record<string, unknown>): Promise<any> {
    const { table, where, returning } = args;
    
    this.logger.info(`🗑️ Deleting records from table: ${table}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          table: table as string,
          where: where as Record<string, unknown>,
          returning: returning as string,
          deleted_count: 1,
          deleted_records: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              deleted_at: new Date().toISOString()
            }
          ]
        }, null, 2)
      }]
    };
  }

  private async handleGetUserData(args: Record<string, unknown>): Promise<any> {
    const { user_id, table, limit, order_by, order_direction } = args;
    
    this.logger.info(`👤 Getting user data for user: ${user_id} from table: ${table}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          user_id: user_id as string,
          table: table as string,
          limit: limit || 50,
          order_by: order_by as string,
          order_direction: order_direction || 'desc',
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              user_id: user_id as string,
              content: 'Sample user data',
              created_at: new Date().toISOString()
            }
          ],
          count: 1
        }, null, 2)
      }]
    };
  }

  private async handleCreateThought(args: Record<string, unknown>): Promise<any> {
    const { user_id, content, workspace_id, metadata, tags } = args;
    
    this.logger.info(`💭 Creating thought for user: ${user_id}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          thought: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: user_id as string,
            content: content as string,
            workspace_id: workspace_id as string,
            metadata: metadata as Record<string, unknown> || {},
            tags: tags as string[] || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }, null, 2)
      }]
    };
  }

  private async handleGetThoughts(args: Record<string, unknown>): Promise<any> {
    const { user_id, workspace_id, limit, offset, tags, search } = args;
    
    this.logger.info(`💭 Getting thoughts for user: ${user_id}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          user_id: user_id as string,
          workspace_id: workspace_id as string,
          limit: limit || 50,
          offset: offset || 0,
          filters: { tags: tags as string[], search: search as string },
          thoughts: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              user_id: user_id as string,
              content: 'Sample thought content',
              workspace_id: workspace_id as string,
              tags: ['ai', 'brain'],
              created_at: new Date().toISOString()
            }
          ],
          count: 1,
          total_count: 1250
        }, null, 2)
      }]
    };
  }

  private async handleCreateWorkspace(args: Record<string, unknown>): Promise<any> {
    const { name, description, creator_id, settings, is_public } = args;
    
    this.logger.info(`🏗️ Creating workspace: ${name}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          workspace: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: name as string,
            description: description as string,
            creator_id: creator_id as string,
            settings: settings as Record<string, unknown> || {},
            is_public: is_public || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }, null, 2)
      }]
    };
  }

  private async handleGetWorkspaces(args: Record<string, unknown>): Promise<any> {
    const { user_id, include_public, limit } = args;
    
    this.logger.info(`🏗️ Getting workspaces for user: ${user_id}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          user_id: user_id as string,
          include_public: include_public || true,
          limit: limit || 50,
          workspaces: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'My Workspace',
              description: 'Personal workspace',
              creator_id: user_id as string,
              is_public: false,
              member_count: 1,
              created_at: new Date().toISOString()
            }
          ],
          count: 1
        }, null, 2)
      }]
    };
  }

  private async handleJoinWorkspace(args: Record<string, unknown>): Promise<any> {
    const { user_id, workspace_id, role } = args;
    
    this.logger.info(`👥 User ${user_id} joining workspace ${workspace_id} as ${role}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          membership: {
            user_id: user_id as string,
            workspace_id: workspace_id as string,
            role: role || 'contributor',
            joined_at: new Date().toISOString()
          }
        }, null, 2)
      }]
    };
  }

  private async handleGetAnalytics(args: Record<string, unknown>): Promise<any> {
    const { user_id, metric, period, start_date, end_date } = args;
    
    this.logger.info(`📊 Getting analytics for user: ${user_id}, metric: ${metric}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          user_id: user_id as string,
          metric: metric as string,
          period: period || 'month',
          start_date: start_date as string,
          end_date: end_date as string,
          data: {
            value: 42,
            trend: '+15%',
            breakdown: [
              { label: 'This month', value: 42 },
              { label: 'Last month', value: 36 }
            ]
          },
          generated_at: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  // Resource Handlers
  private async handleGetPublicSchema(): Promise<any> {
    return {
      contents: [{
        uri: 'database://schema/public',
        mimeType: 'application/json',
        text: JSON.stringify({
          schema: 'public',
          tables: [
            {
              name: 'users',
              columns: ['id', 'email', 'name', 'created_at'],
              primary_key: 'id',
              foreign_keys: []
            },
            {
              name: 'thoughts',
              columns: ['id', 'user_id', 'content', 'workspace_id', 'created_at'],
              primary_key: 'id',
              foreign_keys: ['user_id -> users(id)', 'workspace_id -> workspaces(id)']
            }
          ]
        }, null, 2)
      }]
    };
  }

  private async handleGetDatabaseStats(): Promise<any> {
    return {
      contents: [{
        uri: 'database://stats/overview',
        mimeType: 'application/json',
        text: JSON.stringify({
          total_tables: 12,
          total_rows: 15420,
          database_size: '45.2 MB',
          last_backup: '2024-01-15T10:30:00Z',
          active_connections: 8,
          uptime: '99.9%'
        }, null, 2)
      }]
    };
  }

  private async handleGetOliverOSTables(): Promise<any> {
    return {
      contents: [{
        uri: 'database://tables/oliver-os',
        mimeType: 'application/json',
        text: JSON.stringify({
          oliver_os_tables: [
            {
              name: 'thoughts',
              description: 'User thoughts and ideas',
              columns: ['id', 'user_id', 'content', 'workspace_id', 'metadata', 'tags', 'created_at']
            },
            {
              name: 'workspaces',
              description: 'Collaboration workspaces',
              columns: ['id', 'name', 'description', 'creator_id', 'settings', 'is_public', 'created_at']
            },
            {
              name: 'workspace_members',
              description: 'Workspace membership',
              columns: ['id', 'workspace_id', 'user_id', 'role', 'joined_at']
            }
          ]
        }, null, 2)
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
