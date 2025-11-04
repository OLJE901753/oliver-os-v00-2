/**
 * Memory MCP Server for Oliver-OS
 * Provides persistent context and memory management
 */

import { EventEmitter } from 'node:events';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Logger } from '../../core/logger';
import type { MCPTool, MCPResource, MCPRequest, MCPResponse, OliverOSMCPServer, MCPServerConfig, MCPToolResult, MCPResourceResult } from '../types';

interface MemoryRecord {
  key: string;
  value: Record<string, unknown>;
  ttl?: number;
  tags?: string[];
  priority?: string | Record<string, unknown>;
  createdAt: string;
  lastAccessed?: string;
  accessCount?: number;
  // Additional properties for internal management
  created_at?: string;
  updated_at?: string;
  expires_at?: string | null;
  deleted?: boolean;
}

export class MemoryMCPServer extends EventEmitter implements OliverOSMCPServer {
  private _logger: Logger;
  public config: MCPServerConfig;
  private isRunning: boolean = false;
  private memoryDir: string;
  private memories: Map<string, MemoryRecord> = new Map();

  constructor(memoryDir?: string) {
    super();
    this._logger = new Logger('Memory-MCP-Server');
    this.memoryDir = memoryDir || path.join(process.cwd(), '.oliver-memory');
    this.config = this.createServerConfig();
    this.initializeMemory();
  }

  private createServerConfig(): MCPServerConfig {
    return {
      name: 'memory-mcp-server',
      version: '1.0.0',
      description: 'Memory MCP Server for persistent context and memory management',
      port: 4006,
      host: 'localhost',
      tools: this.createTools(),
      resources: this.createResources()
    };
  }

  private async initializeMemory(): Promise<void> {
    try {
      await fs.ensureDir(this.memoryDir);
      await this.loadMemories();
      this._logger.info(`🧠 Memory initialized in: ${this.memoryDir}`);
    } catch (error) {
      this._logger.error('❌ Failed to initialize memory', error);
    }
  }

  private async loadMemories(): Promise<void> {
    try {
      const memoryFiles = await fs.readdir(this.memoryDir);
      for (const file of memoryFiles) {
        if (file.endsWith('.json')) {
          const memoryPath = path.join(this.memoryDir, file);
          const memoryData = await fs.readJSON(memoryPath);
          const key = path.basename(file, '.json');
          this.memories.set(key, memoryData);
        }
      }
      this._logger.info(`📚 Loaded ${this.memories.size} memories`);
    } catch (error) {
      this._logger.error('❌ Failed to load memories', error);
    }
  }

  private createTools(): MCPTool[] {
    return [
      {
        name: 'memory_store',
        description: 'Store information in persistent memory',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Memory key identifier' },
            value: { type: 'object', description: 'Data to store' },
            ttl: { type: 'number', description: 'Time to live in seconds' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], default: 'medium', description: 'Memory priority' }
          },
          required: ['key', 'value']
        },
        handler: this.handleStoreMemory.bind(this)
      },
      {
        name: 'memory_retrieve',
        description: 'Retrieve information from memory',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Memory key to retrieve' },
            include_metadata: { type: 'boolean', default: true, description: 'Include metadata in response' }
          },
          required: ['key']
        },
        handler: this.handleRetrieveMemory.bind(this)
      },
      {
        name: 'memory_search',
        description: 'Search memories by content or tags',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
            limit: { type: 'number', default: 10, description: 'Maximum number of results' },
            sort_by: { type: 'string', enum: ['created', 'updated', 'priority', 'relevance'], default: 'relevance', description: 'Sort results by' }
          },
          required: ['query']
        },
        handler: this.handleSearchMemory.bind(this)
      },
      {
        name: 'memory_update',
        description: 'Update existing memory',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Memory key to update' },
            value: { type: 'object', description: 'New data to store' },
            merge: { type: 'boolean', default: true, description: 'Merge with existing data' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Update tags' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Update priority' }
          },
          required: ['key', 'value']
        },
        handler: this.handleUpdateMemory.bind(this)
      },
      {
        name: 'memory_delete',
        description: 'Delete memory by key',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Memory key to delete' },
            permanent: { type: 'boolean', default: false, description: 'Permanently delete (not just mark as deleted)' }
          },
          required: ['key']
        },
        handler: this.handleDeleteMemory.bind(this)
      },
      {
        name: 'memory_list',
        description: 'List all memories with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Filter by priority' },
            limit: { type: 'number', default: 50, description: 'Maximum number of results' },
            offset: { type: 'number', default: 0, description: 'Offset for pagination' },
            include_deleted: { type: 'boolean', default: false, description: 'Include deleted memories' }
          }
        },
        handler: this.handleListMemories.bind(this)
      },
      {
        name: 'memory_export',
        description: 'Export memories to a file',
        inputSchema: {
          type: 'object',
          properties: {
            format: { type: 'string', enum: ['json', 'csv', 'txt'], default: 'json', description: 'Export format' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
            include_metadata: { type: 'boolean', default: true, description: 'Include metadata' },
            output_path: { type: 'string', description: 'Output file path' }
          }
        },
        handler: this.handleExportMemory.bind(this)
      },
      {
        name: 'memory_import',
        description: 'Import memories from a file',
        inputSchema: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Path to import file' },
            format: { type: 'string', enum: ['json', 'csv', 'txt'], default: 'json', description: 'Import format' },
            merge_mode: { type: 'string', enum: ['replace', 'merge', 'skip'], default: 'merge', description: 'How to handle existing memories' }
          },
          required: ['file_path']
        },
        handler: this.handleImportMemory.bind(this)
      },
      {
        name: 'memory_cleanup',
        description: 'Clean up expired or old memories',
        inputSchema: {
          type: 'object',
          properties: {
            max_age_days: { type: 'number', default: 30, description: 'Maximum age in days' },
            priority_filter: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Only clean up memories with this priority or lower' },
            dry_run: { type: 'boolean', default: false, description: 'Show what would be cleaned up without actually deleting' }
          }
        },
        handler: this.handleCleanupMemory.bind(this)
      },
      {
        name: 'memory_stats',
        description: 'Get memory statistics and health information',
        inputSchema: {
          type: 'object',
          properties: {
            include_details: { type: 'boolean', default: true, description: 'Include detailed statistics' }
          }
        },
        handler: this.handleMemoryStats.bind(this)
      }
    ];
  }

  private createResources(): MCPResource[] {
    return [
      {
        uri: 'memory://all',
        name: 'All Memories',
        description: 'Complete memory database',
        mimeType: 'application/json',
        handler: this.handleGetAllMemories.bind(this)
      },
      {
        uri: 'memory://recent',
        name: 'Recent Memories',
        description: 'Recently created or updated memories',
        mimeType: 'application/json',
        handler: this.handleGetRecentMemories.bind(this)
      },
      {
        uri: 'memory://tags',
        name: 'Memory Tags',
        description: 'All available memory tags and their usage',
        mimeType: 'application/json',
        handler: this.handleGetMemoryTags.bind(this)
      }
    ];
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this._logger.warn('Memory MCP Server is already running');
      return;
    }

    try {
      this._logger.info(`🚀 Starting Memory MCP Server on ${this.config.host}:${this.config.port}`);
      this._logger.info(`🧠 Memory directory: ${this.memoryDir}`);
      this._logger.info(`📋 Available tools: ${this.config.tools.length}`);
      this._logger.info(`📚 Available resources: ${this.config.resources.length}`);
      
      this.isRunning = true;
      this.emit('started');
      
      this._logger.info('✅ Memory MCP Server started successfully');
    } catch (error) {
      this._logger.error('❌ Failed to start Memory MCP Server', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this._logger.warn('Memory MCP Server is not running');
      return;
    }

    try {
      this._logger.info('🛑 Stopping Memory MCP Server...');
      await this.saveMemories();
      this.isRunning = false;
      this.emit('stopped');
      this._logger.info('✅ Memory MCP Server stopped successfully');
    } catch (error) {
      this._logger.error('❌ Failed to stop Memory MCP Server', error);
      throw error;
    }
  }

  private async saveMemories(): Promise<void> {
    try {
      for (const [key, memory] of this.memories.entries()) {
        const memoryPath = path.join(this.memoryDir, `${key}.json`);
        await fs.writeJSON(memoryPath, memory, { spaces: 2 });
      }
      this._logger.info(`💾 Saved ${this.memories.size} memories`);
    } catch (error) {
      this._logger.error('❌ Failed to save memories', error);
    }
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      this._logger.debug(`📨 Handling Memory MCP request: ${request.method}`);

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
      this._logger.error('❌ Error handling Memory MCP request', error);
      return this.createErrorResponse(request.id, -32603, 'Internal error', error);
    }
  }

  private async handleToolsList(request: MCPRequest): Promise<MCPResponse> {
    const tools = this.config.tools.map((tool: MCPTool) => ({
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
    
    const tool = this.config.tools.find((t: MCPTool) => t.name === name);
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
      this._logger.error(`❌ Error executing Memory tool ${name}`, error);
      return this.createErrorResponse(request.id, -32603, `Tool execution failed: ${error}`);
    }
  }

  private async handleResourcesList(request: MCPRequest): Promise<MCPResponse> {
    const resources = this.config.resources.map((resource: MCPResource) => ({
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
    
    const resource = this.config.resources.find((r: MCPResource) => r.uri === uri);
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
      this._logger.error(`❌ Error reading Memory resource ${uri}`, error);
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
  private async handleStoreMemory(args: Record<string, unknown>): Promise<MCPToolResult> {
    const { key, value, ttl, tags, priority } = args;
    
    this._logger.info(`💾 Storing memory: ${key}`);
    
    const now = new Date().toISOString();
    const memory: MemoryRecord = {
      key: key as string,
      value: value as Record<string, unknown>,
      tags: (tags as string[]) || [],
      priority: (priority as string | Record<string, unknown>) || 'medium',
      createdAt: now,
      created_at: now,
      updated_at: now,
      expires_at: ttl ? new Date(Date.now() + (ttl as number) * 1000).toISOString() : null,
      deleted: false
    };
    
    // Conditionally add ttl only if it's defined
    if (ttl !== undefined) {
      memory.ttl = ttl as number;
    }
    
    this.memories.set(key as string, memory);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          key: key as string,
          memory,
          stored_at: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  private async handleRetrieveMemory(args: Record<string, unknown>): Promise<MCPToolResult> {
    const { key, include_metadata } = args;
    
    this._logger.info(`🔍 Retrieving memory: ${key}`);
    
    const memory = this.memories.get(key as string);
    if (!memory) {
      return this.createErrorResult(`Memory not found: ${key}`);
    }
    
    if (memory.deleted) {
      return this.createErrorResult(`Memory is deleted: ${key}`);
    }
    
    if (memory.expires_at && new Date(memory.expires_at) < new Date()) {
      this.memories.delete(key as string);
      return this.createErrorResult(`Memory expired: ${key}`);
    }
    
    const result = include_metadata ? memory : memory.value;
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          key: key as string,
          memory: result,
          retrieved_at: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  private async handleSearchMemory(args: Record<string, unknown>): Promise<MCPToolResult> {
    const { query, tags, limit, sort_by } = args;
    
    this._logger.info(`🔍 Searching memories: ${query}`);
    
    const results = Array.from(this.memories.values())
      .filter(memory => !memory.deleted)
      .filter(memory => {
        if (tags && Array.isArray(tags)) {
          return tags.some(tag => memory.tags?.includes(tag));
        }
        return true;
      })
      .filter(memory => {
        const searchText = JSON.stringify(memory.value).toLowerCase();
        return searchText.includes((query as string).toLowerCase());
      })
      .sort((a, b) => {
        switch (sort_by) {
          case 'created':
            return new Date(a.created_at || a.createdAt).getTime() - new Date(b.created_at || b.createdAt).getTime();
          case 'updated':
            return new Date(b.updated_at || b.createdAt).getTime() - new Date(a.updated_at || a.createdAt).getTime();
          case 'priority': {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const aPriority = typeof a.priority === 'string' ? a.priority : 'medium';
            const bPriority = typeof b.priority === 'string' ? b.priority : 'medium';
            return priorityOrder[bPriority as keyof typeof priorityOrder] - priorityOrder[aPriority as keyof typeof priorityOrder];
          }
          default:
            return 0;
        }
      })
      .slice(0, limit as number || 10);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          query: query as string,
          results,
          count: results.length,
          searched_at: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  private async handleUpdateMemory(args: Record<string, unknown>): Promise<MCPToolResult> {
    const { key, value, merge, tags, priority } = args;
    
    this._logger.info(`✏️ Updating memory: ${key}`);
    
    const existingMemory = this.memories.get(key as string);
    if (!existingMemory) {
      return this.createErrorResult(`Memory not found: ${key}`);
    }
    
    if (existingMemory.deleted) {
      return this.createErrorResult(`Memory is deleted: ${key}`);
    }
    
    const updatedMemory: MemoryRecord = {
      key: existingMemory.key,
      value: merge ? { ...existingMemory.value, ...(value as Record<string, unknown>) } : value as Record<string, unknown>,
      createdAt: existingMemory.createdAt,
      updated_at: new Date().toISOString(),
      tags: (tags as string[]) || existingMemory.tags || [],
      priority: (priority as string | Record<string, unknown>) || existingMemory.priority || 'medium'
    };
    
    // Conditionally add optional properties from existingMemory
    if (existingMemory.ttl !== undefined) {
      updatedMemory.ttl = existingMemory.ttl;
    }
    if (existingMemory.lastAccessed !== undefined) {
      updatedMemory.lastAccessed = existingMemory.lastAccessed;
    }
    if (existingMemory.accessCount !== undefined) {
      updatedMemory.accessCount = existingMemory.accessCount;
    }
    if (existingMemory.created_at !== undefined) {
      updatedMemory.created_at = existingMemory.created_at;
    }
    if (existingMemory.expires_at !== undefined && existingMemory.expires_at !== null) {
      updatedMemory.expires_at = existingMemory.expires_at;
    }
    if (existingMemory.deleted !== undefined) {
      updatedMemory.deleted = existingMemory.deleted;
    }
    
    this.memories.set(key as string, updatedMemory);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          key: key as string,
          memory: updatedMemory,
          updated_at: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  private async handleDeleteMemory(args: Record<string, unknown>): Promise<MCPToolResult> {
    const { key, permanent } = args;
    
    this._logger.info(`🗑️ Deleting memory: ${key}`);
    
    const memory = this.memories.get(key as string);
    if (!memory) {
      return this.createErrorResult(`Memory not found: ${key}`);
    }
    
    if (permanent) {
      this.memories.delete(key as string);
    } else {
      memory.deleted = true;
      memory.updated_at = new Date().toISOString();
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          key: key as string,
          permanent: permanent || false,
          deleted_at: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  private async handleListMemories(args: Record<string, unknown>): Promise<MCPToolResult> {
    const { tags, priority, limit, offset, include_deleted } = args;
    
    this._logger.info(`📋 Listing memories`);
    
    let memories = Array.from(this.memories.values());
    
    if (!include_deleted) {
      memories = memories.filter(memory => !memory.deleted);
    }
    
    if (tags && Array.isArray(tags)) {
      memories = memories.filter(memory => {
        const memoryTags = memory.tags;
        return memoryTags && tags.some(tag => memoryTags.includes(tag));
      });
    }
    
    if (priority) {
      memories = memories.filter(memory => memory.priority === priority);
    }
    
    const paginatedMemories = memories.slice(offset as number || 0, (offset as number || 0) + (limit as number || 50));
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          memories: paginatedMemories,
          total: memories.length,
          limit: limit || 50,
          offset: offset || 0,
          listed_at: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  private async handleExportMemory(args: Record<string, unknown>): Promise<MCPToolResult> {
    const { format, tags, include_metadata, output_path } = args;
    const exportFormat = (format as string) || 'json';
    
    this._logger.info(`📤 Exporting memories in ${exportFormat} format`);
    
    let memories = Array.from(this.memories.values());
    
    if (tags && Array.isArray(tags)) {
      memories = memories.filter(memory => {
        const memoryTags = memory.tags;
        return memoryTags && tags.some(tag => memoryTags.includes(tag));
      });
    }
    
    if (!include_metadata) {
      memories = memories.map(memory => ({ key: memory.key, value: memory.value, createdAt: memory.createdAt }));
    }
    
    const exportPath = (output_path as string) || path.join(this.memoryDir, `export_${Date.now()}.${exportFormat}`);
    
    try {
      if (exportFormat === 'json') {
        await fs.writeJSON(exportPath as string, memories, { spaces: 2 });
      } else if (exportFormat === 'csv') {
        // Simple CSV export
        const csvContent = memories.map(memory => {
          const tagsStr = memory.tags?.join(';') || '';
          const priorityStr = typeof memory.priority === 'string' ? memory.priority : 'medium';
          return `${memory.key},"${JSON.stringify(memory.value).replace(/"/g, '""')}",${tagsStr},${priorityStr}`;
        }).join('\n');
        await fs.writeFile(exportPath as string, csvContent);
      } else {
        const txtContent = memories.map(memory => {
          const tagsStr = memory.tags?.join(', ') || '';
          const priorityStr = typeof memory.priority === 'string' ? memory.priority : 'medium';
          return `Key: ${memory.key}\nValue: ${JSON.stringify(memory.value, null, 2)}\nTags: ${tagsStr}\nPriority: ${priorityStr}\n---\n`;
        }).join('\n');
        await fs.writeFile(exportPath as string, txtContent);
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            format: exportFormat,
            output_path: exportPath,
            count: memories.length,
            exported_at: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      this._logger.error('❌ Export failed', error);
      return this.createErrorResult(`Export failed: ${error}`);
    }
  }

  private async handleImportMemory(args: Record<string, unknown>): Promise<MCPToolResult> {
    const { file_path, format, merge_mode } = args;
    
    this._logger.info(`📥 Importing memories from ${file_path}`);
    
    try {
      let importedMemories: MemoryRecord[] = [];
      
      if (format === 'json') {
        importedMemories = await fs.readJSON(file_path as string) as MemoryRecord[];
      } else {
        return this.createErrorResult(`Unsupported import format: ${format}`);
      }
      
      let imported = 0;
      let skipped = 0;
      let merged = 0;
      
      for (const memory of importedMemories) {
        const existing = this.memories.get(memory.key);
        
        if (existing) {
          if (merge_mode === 'replace') {
            this.memories.set(memory.key, memory);
            imported++;
          } else if (merge_mode === 'merge') {
            const mergedMemory = { ...existing, ...memory, updated_at: new Date().toISOString() };
            this.memories.set(memory.key, mergedMemory);
            merged++;
          } else {
            skipped++;
          }
        } else {
          this.memories.set(memory.key, memory);
          imported++;
        }
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            file_path: file_path as string,
            format: format as string,
            merge_mode: merge_mode as string,
            imported,
            merged,
            skipped,
            total: importedMemories.length,
            imported_at: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      this._logger.error('❌ Import failed', error);
      return this.createErrorResult(`Import failed: ${error}`);
    }
  }

  private async handleCleanupMemory(args: Record<string, unknown>): Promise<MCPToolResult> {
    const { max_age_days, priority_filter, dry_run } = args;
    
    this._logger.info(`🧹 Cleaning up memories (dry_run: ${dry_run})`);
    
    const maxAge = (max_age_days as number || 30) * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - maxAge);
    
    const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    const filterPriority = priorityOrder[priority_filter as keyof typeof priorityOrder] || 0;
    
    const toCleanup = Array.from(this.memories.entries())
      .filter(([_key, memory]) => {
        if (memory.deleted) return true;
        const createdDate = memory.created_at || memory.createdAt;
        if (createdDate && new Date(createdDate) < cutoffDate) return true;
        const priorityStr = typeof memory.priority === 'string' ? memory.priority : 'medium';
        if (priority_filter && priorityOrder[priorityStr as keyof typeof priorityOrder] <= filterPriority) return true;
        if (memory.expires_at && new Date(memory.expires_at) < new Date()) return true;
        return false;
      });
    
    if (!dry_run) {
      for (const [k] of toCleanup) {
        this.memories.delete(k);
      }
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          dry_run: dry_run || false,
          max_age_days: max_age_days || 30,
          priority_filter: priority_filter as string,
          cleanup_candidates: toCleanup.length,
          cleaned_up: dry_run ? 0 : toCleanup.length,
          cleaned_at: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  private async handleMemoryStats(_args: Record<string, unknown>): Promise<MCPToolResult> {
    // const { include_details: _includeDetails } = args; // Unused parameter
    
    this._logger.info(`📊 Getting memory statistics`);
    
    const memories = Array.from(this.memories.values());
    const activeMemories = memories.filter(m => !m.deleted);
    const deletedMemories = memories.filter(m => m.deleted);
    
    const stats = {
      total_memories: memories.length,
      active_memories: activeMemories.length,
      deleted_memories: deletedMemories.length,
      memory_directory: this.memoryDir,
      total_size: JSON.stringify(memories).length,
      priority_distribution: {
        low: activeMemories.filter(m => (typeof m.priority === 'string' ? m.priority : 'medium') === 'low').length,
        medium: activeMemories.filter(m => (typeof m.priority === 'string' ? m.priority : 'medium') === 'medium').length,
        high: activeMemories.filter(m => (typeof m.priority === 'string' ? m.priority : 'medium') === 'high').length,
        critical: activeMemories.filter(m => (typeof m.priority === 'string' ? m.priority : 'medium') === 'critical').length
      },
      tag_usage: this.getTagUsage(activeMemories),
      oldest_memory: activeMemories.length > 0 ? 
        activeMemories.reduce((oldest, current) => {
          const oldestDate = oldest.created_at || oldest.createdAt;
          const currentDate = current.created_at || current.createdAt;
          return new Date(currentDate) < new Date(oldestDate) ? current : oldest;
        }).created_at || null : null,
      newest_memory: activeMemories.length > 0 ? 
        activeMemories.reduce((newest, current) => {
          const newestDate = newest.created_at || newest.createdAt;
          const currentDate = current.created_at || current.createdAt;
          return new Date(currentDate) > new Date(newestDate) ? current : newest;
        }).created_at || null : null,
      generated_at: new Date().toISOString()
    };
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(stats, null, 2)
      }]
    };
  }

  private getTagUsage(memories: MemoryRecord[]): Record<string, number> {
    const tagCount: Record<string, number> = {};
    for (const memory of memories) {
      if (memory.tags) {
        for (const tag of memory.tags) {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        }
      }
    }
    return tagCount;
  }

  // Resource Handlers
  private async handleGetAllMemories(): Promise<MCPResourceResult> {
    return {
      contents: [{
        uri: 'memory://all',
        mimeType: 'application/json',
        text: JSON.stringify(Array.from(this.memories.values()), null, 2)
      }]
    };
  }

  private async handleGetRecentMemories(): Promise<MCPResourceResult> {
    const recentMemories = Array.from(this.memories.values())
      .filter(m => !m.deleted)
      .sort((a, b) => {
        const aDate = a.updated_at || a.createdAt;
        const bDate = b.updated_at || b.createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      })
      .slice(0, 10);
    
    return {
      contents: [{
        uri: 'memory://recent',
        mimeType: 'application/json',
        text: JSON.stringify(recentMemories, null, 2)
      }]
    };
  }

  private async handleGetMemoryTags(): Promise<MCPResourceResult> {
    const activeMemories = Array.from(this.memories.values()).filter(m => !m.deleted);
    const tagUsage = this.getTagUsage(activeMemories);
    
    return {
      contents: [{
        uri: 'memory://tags',
        mimeType: 'application/json',
        text: JSON.stringify(tagUsage, null, 2)
      }]
    };
  }

  private createErrorResult(message: string): MCPToolResult {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: message,
          timestamp: new Date().toISOString()
        }, null, 2)
      }],
      isError: true,
      error: message
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
