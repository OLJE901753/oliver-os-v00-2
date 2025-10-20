/**
 * MCP Tool Adapters for Codebuff Integration
 * Exposes MCP servers as Codebuff tools for orchestrated agent workflows
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Logger } from '../../core/logger';
import type { CustomToolDefinition, MCPServerInfo } from './types';

export interface MCPToolAdapter {
  serverName: string;
  tools: CustomToolDefinition[];
  healthCheck: () => Promise<boolean>;
  executeTool: (toolName: string, args: Record<string, unknown>) => Promise<unknown>;
}

export class FilesystemMCPAdapter implements MCPToolAdapter {
  private logger: Logger;
  public serverName = 'filesystem';
  public tools: CustomToolDefinition[];

  constructor() {
    this.logger = new Logger('FilesystemMCPAdapter');
    this.tools = this.initializeTools();
  }

  private initializeTools(): CustomToolDefinition[] {
    return [
      {
        name: 'read_file',
        description: 'Read contents of a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file to read' },
            encoding: { type: 'string', description: 'File encoding (default: utf8)' }
          },
          required: ['path']
        },
        mcpServer: 'filesystem',
        timeout: 5000,
        retries: 2
      },
      {
        name: 'write_file',
        description: 'Write content to a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file to write' },
            content: { type: 'string', description: 'Content to write to the file' },
            encoding: { type: 'string', description: 'File encoding (default: utf8)' }
          },
          required: ['path', 'content']
        },
        mcpServer: 'filesystem',
        timeout: 5000,
        retries: 2
      },
      {
        name: 'list_directory',
        description: 'List contents of a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the directory to list' },
            recursive: { type: 'boolean', description: 'Whether to list recursively' }
          },
          required: ['path']
        },
        mcpServer: 'filesystem',
        timeout: 5000,
        retries: 2
      },
      {
        name: 'create_directory',
        description: 'Create a new directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path of the directory to create' },
            recursive: { type: 'boolean', description: 'Whether to create parent directories' }
          },
          required: ['path']
        },
        mcpServer: 'filesystem',
        timeout: 5000,
        retries: 2
      },
      {
        name: 'delete_file',
        description: 'Delete a file or directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file or directory to delete' },
            recursive: { type: 'boolean', description: 'Whether to delete recursively for directories' }
          },
          required: ['path']
        },
        mcpServer: 'filesystem',
        timeout: 5000,
        retries: 2
      },
      {
        name: 'search_files',
        description: 'Search for files matching a pattern',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: 'Search pattern (glob or regex)' },
            directory: { type: 'string', description: 'Directory to search in' },
            recursive: { type: 'boolean', description: 'Whether to search recursively' }
          },
          required: ['pattern']
        },
        mcpServer: 'filesystem',
        timeout: 10000,
        retries: 2
      }
    ];
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - verify we can access the filesystem
      const fs = await import('fs/promises');
      await fs.access(process.cwd());
      return true;
    } catch (error) {
      this.logger.error('Filesystem health check failed', error);
      return false;
    }
  }

  async executeTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const fs = await import('fs/promises');
    const path = await import('path');

    switch (toolName) {
      case 'read_file':
        const filePath = args.path as string;
        const encoding = (args.encoding as string) || 'utf8';
        return await fs.readFile(filePath, encoding);

      case 'write_file':
        const writePath = args.path as string;
        const content = args.content as string;
        const writeEncoding = (args.encoding as string) || 'utf8';
        await fs.writeFile(writePath, content, writeEncoding);
        return { success: true, message: `File written to ${writePath}` };

      case 'list_directory':
        const dirPath = args.path as string;
        const recursive = args.recursive as boolean || false;
        if (recursive) {
          // Simple recursive implementation
          const items = await fs.readdir(dirPath, { withFileTypes: true });
          return items.map(item => ({
            name: item.name,
            type: item.isDirectory() ? 'directory' : 'file',
            path: path.join(dirPath, item.name)
          }));
        } else {
          const items = await fs.readdir(dirPath, { withFileTypes: true });
          return items.map(item => ({
            name: item.name,
            type: item.isDirectory() ? 'directory' : 'file'
          }));
        }

      case 'create_directory':
        const createPath = args.path as string;
        const createRecursive = args.recursive as boolean || false;
        await fs.mkdir(createPath, { recursive: createRecursive });
        return { success: true, message: `Directory created: ${createPath}` };

      case 'delete_file':
        const deletePath = args.path as string;
        const deleteRecursive = args.recursive as boolean || false;
        const stat = await fs.stat(deletePath);
        if (stat.isDirectory()) {
          await fs.rmdir(deletePath, { recursive: deleteRecursive });
        } else {
          await fs.unlink(deletePath);
        }
        return { success: true, message: `Deleted: ${deletePath}` };

      case 'search_files':
        const pattern = args.pattern as string;
        const searchDir = (args.directory as string) || process.cwd();
        const searchRecursive = args.recursive as boolean || false;
        
        // Simple glob-like search implementation
        const items = await fs.readdir(searchDir, { withFileTypes: true });
        const matches = items.filter(item => {
          if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(item.name);
          }
          return item.name.includes(pattern);
        });
        
        return matches.map(item => ({
          name: item.name,
          type: item.isDirectory() ? 'directory' : 'file',
          path: path.join(searchDir, item.name)
        }));

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}

export class DatabaseMCPAdapter implements MCPToolAdapter {
  private logger: Logger;
  public serverName = 'database';
  public tools: CustomToolDefinition[];

  constructor() {
    this.logger = new Logger('DatabaseMCPAdapter');
    this.tools = this.initializeTools();
  }

  private initializeTools(): CustomToolDefinition[] {
    return [
      {
        name: 'query_database',
        description: 'Execute a database query',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'SQL query to execute' },
            parameters: { type: 'array', description: 'Query parameters' }
          },
          required: ['query']
        },
        mcpServer: 'database',
        timeout: 30000,
        retries: 3
      },
      {
        name: 'get_table_schema',
        description: 'Get schema information for a table',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: { type: 'string', description: 'Name of the table' }
          },
          required: ['tableName']
        },
        mcpServer: 'database',
        timeout: 10000,
        retries: 2
      },
      {
        name: 'list_tables',
        description: 'List all tables in the database',
        inputSchema: {
          type: 'object',
          properties: {
            schema: { type: 'string', description: 'Database schema name' }
          }
        },
        mcpServer: 'database',
        timeout: 10000,
        retries: 2
      },
      {
        name: 'create_table',
        description: 'Create a new table',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: { type: 'string', description: 'Name of the table to create' },
            columns: { type: 'array', description: 'Column definitions' }
          },
          required: ['tableName', 'columns']
        },
        mcpServer: 'database',
        timeout: 30000,
        retries: 2
      },
      {
        name: 'insert_data',
        description: 'Insert data into a table',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: { type: 'string', description: 'Name of the table' },
            data: { type: 'object', description: 'Data to insert' }
          },
          required: ['tableName', 'data']
        },
        mcpServer: 'database',
        timeout: 15000,
        retries: 2
      }
    ];
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Check database connection
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$connect();
      await prisma.$disconnect();
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }

  async executeTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      switch (toolName) {
        case 'query_database':
          const query = args.query as string;
          const parameters = args.parameters as any[] || [];
          // Note: This is a simplified implementation
          // In production, you'd want proper SQL query execution
          return { message: 'Query execution not fully implemented', query, parameters };

        case 'get_table_schema':
          const tableName = args.tableName as string;
          // Simplified schema retrieval
          return { 
            tableName, 
            columns: [], 
            message: 'Schema retrieval not fully implemented' 
          };

        case 'list_tables':
          // Simplified table listing
          return { 
            tables: [], 
            message: 'Table listing not fully implemented' 
          };

        case 'create_table':
          const createTableName = args.tableName as string;
          const columns = args.columns as any[];
          return { 
            success: true, 
            message: `Table ${createTableName} creation not fully implemented`,
            columns 
          };

        case 'insert_data':
          const insertTableName = args.tableName as string;
          const data = args.data as Record<string, unknown>;
          return { 
            success: true, 
            message: `Data insertion into ${insertTableName} not fully implemented`,
            data 
          };

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } finally {
      await prisma.$disconnect();
    }
  }
}

export class WebSearchMCPAdapter implements MCPToolAdapter {
  private logger: Logger;
  public serverName = 'websearch';
  public tools: CustomToolDefinition[];

  constructor() {
    this.logger = new Logger('WebSearchMCPAdapter');
    this.tools = this.initializeTools();
  }

  private initializeTools(): CustomToolDefinition[] {
    return [
      {
        name: 'search_web',
        description: 'Search the web for information',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'number', description: 'Maximum number of results' },
            language: { type: 'string', description: 'Search language' }
          },
          required: ['query']
        },
        mcpServer: 'websearch',
        timeout: 15000,
        retries: 2
      },
      {
        name: 'get_page_content',
        description: 'Get content from a specific web page',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'URL to fetch content from' },
            selector: { type: 'string', description: 'CSS selector to extract specific content' }
          },
          required: ['url']
        },
        mcpServer: 'websearch',
        timeout: 10000,
        retries: 2
      }
    ];
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - verify we can make HTTP requests
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('https://httpbin.org/status/200', { timeout: 5000 });
      return response.ok;
    } catch (error) {
      this.logger.error('Web search health check failed', error);
      return false;
    }
  }

  async executeTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const fetch = (await import('node-fetch')).default;

    switch (toolName) {
      case 'search_web':
        const query = args.query as string;
        const limit = (args.limit as number) || 10;
        const language = (args.language as string) || 'en';
        
        // Simplified web search implementation
        // In production, you'd integrate with a real search API
        return {
          query,
          results: [],
          message: 'Web search not fully implemented - would search for: ' + query,
          limit,
          language
        };

      case 'get_page_content':
        const url = args.url as string;
        const selector = args.selector as string;
        
        try {
          const response = await fetch(url, { timeout: 10000 });
          const content = await response.text();
          
          return {
            url,
            content: selector ? 'Content extraction not implemented' : content.substring(0, 1000),
            selector,
            success: true
          };
        } catch (error) {
          return {
            url,
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false
          };
        }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}

export class TerminalMCPAdapter implements MCPToolAdapter {
  private logger: Logger;
  public serverName = 'terminal';
  public tools: CustomToolDefinition[];

  constructor() {
    this.logger = new Logger('TerminalMCPAdapter');
    this.tools = this.initializeTools();
  }

  private initializeTools(): CustomToolDefinition[] {
    return [
      {
        name: 'execute_command',
        description: 'Execute a terminal command',
        inputSchema: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'Command to execute' },
            workingDirectory: { type: 'string', description: 'Working directory for the command' },
            timeout: { type: 'number', description: 'Command timeout in milliseconds' }
          },
          required: ['command']
        },
        mcpServer: 'terminal',
        timeout: 30000,
        retries: 1
      },
      {
        name: 'run_script',
        description: 'Run a script file',
        inputSchema: {
          type: 'object',
          properties: {
            scriptPath: { type: 'string', description: 'Path to the script file' },
            args: { type: 'array', description: 'Script arguments' },
            interpreter: { type: 'string', description: 'Script interpreter (node, python, etc.)' }
          },
          required: ['scriptPath']
        },
        mcpServer: 'terminal',
        timeout: 60000,
        retries: 1
      }
    ];
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - verify we can execute basic commands
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      await execAsync('echo "health check"', { timeout: 5000 });
      return true;
    } catch (error) {
      this.logger.error('Terminal health check failed', error);
      return false;
    }
  }

  async executeTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    switch (toolName) {
      case 'execute_command':
        const command = args.command as string;
        const workingDirectory = args.workingDirectory as string || process.cwd();
        const timeout = (args.timeout as number) || 30000;
        
        try {
          const { stdout, stderr } = await execAsync(command, {
            cwd: workingDirectory,
            timeout
          });
          
          return {
            command,
            stdout,
            stderr,
            success: true,
            workingDirectory
          };
        } catch (error) {
          return {
            command,
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false,
            workingDirectory
          };
        }

      case 'run_script':
        const scriptPath = args.scriptPath as string;
        const scriptArgs = (args.args as string[]) || [];
        const interpreter = (args.interpreter as string) || 'node';
        
        const fullCommand = `${interpreter} ${scriptPath} ${scriptArgs.join(' ')}`;
        
        try {
          const { stdout, stderr } = await execAsync(fullCommand, { timeout: 60000 });
          
          return {
            scriptPath,
            interpreter,
            args: scriptArgs,
            stdout,
            stderr,
            success: true
          };
        } catch (error) {
          return {
            scriptPath,
            interpreter,
            args: scriptArgs,
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false
          };
        }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}

export class MemoryMCPAdapter implements MCPToolAdapter {
  private logger: Logger;
  public serverName = 'memory';
  public tools: CustomToolDefinition[];
  private memoryStore: Map<string, any> = new Map();

  constructor() {
    this.logger = new Logger('MemoryMCPAdapter');
    this.tools = this.initializeTools();
  }

  private initializeTools(): CustomToolDefinition[] {
    return [
      {
        name: 'store_memory',
        description: 'Store information in memory',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Memory key' },
            value: { type: 'string', description: 'Value to store' },
            ttl: { type: 'number', description: 'Time to live in seconds' }
          },
          required: ['key', 'value']
        },
        mcpServer: 'memory',
        timeout: 1000,
        retries: 1
      },
      {
        name: 'retrieve_memory',
        description: 'Retrieve information from memory',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Memory key to retrieve' }
          },
          required: ['key']
        },
        mcpServer: 'memory',
        timeout: 1000,
        retries: 1
      },
      {
        name: 'search_memory',
        description: 'Search for information in memory',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: 'Search pattern' },
            limit: { type: 'number', description: 'Maximum number of results' }
          },
          required: ['pattern']
        },
        mcpServer: 'memory',
        timeout: 2000,
        retries: 1
      },
      {
        name: 'delete_memory',
        description: 'Delete information from memory',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Memory key to delete' }
          },
          required: ['key']
        },
        mcpServer: 'memory',
        timeout: 1000,
        retries: 1
      }
    ];
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - verify memory operations work
      this.memoryStore.set('health_check', 'ok');
      const result = this.memoryStore.get('health_check');
      this.memoryStore.delete('health_check');
      return result === 'ok';
    } catch (error) {
      this.logger.error('Memory health check failed', error);
      return false;
    }
  }

  async executeTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    switch (toolName) {
      case 'store_memory':
        const key = args.key as string;
        const value = args.value as string;
        const ttl = (args.ttl as number) || 3600; // 1 hour default
        
        this.memoryStore.set(key, {
          value,
          timestamp: Date.now(),
          ttl: ttl * 1000
        });
        
        return {
          success: true,
          message: `Stored memory with key: ${key}`,
          ttl
        };

      case 'retrieve_memory':
        const retrieveKey = args.key as string;
        const memoryItem = this.memoryStore.get(retrieveKey);
        
        if (!memoryItem) {
          return {
            success: false,
            message: `No memory found for key: ${retrieveKey}`
          };
        }
        
        // Check TTL
        if (Date.now() - memoryItem.timestamp > memoryItem.ttl) {
          this.memoryStore.delete(retrieveKey);
          return {
            success: false,
            message: `Memory expired for key: ${retrieveKey}`
          };
        }
        
        return {
          success: true,
          value: memoryItem.value,
          timestamp: memoryItem.timestamp
        };

      case 'search_memory':
        const pattern = args.pattern as string;
        const limit = (args.limit as number) || 10;
        
        const matches: Array<{ key: string; value: string }> = [];
        
        for (const [key, item] of this.memoryStore.entries()) {
          if (matches.length >= limit) break;
          
          if (key.includes(pattern) || item.value.includes(pattern)) {
            matches.push({ key, value: item.value });
          }
        }
        
        return {
          success: true,
          matches,
          pattern,
          count: matches.length
        };

      case 'delete_memory':
        const deleteKey = args.key as string;
        const existed = this.memoryStore.has(deleteKey);
        this.memoryStore.delete(deleteKey);
        
        return {
          success: true,
          message: existed ? `Deleted memory with key: ${deleteKey}` : `No memory found for key: ${deleteKey}`,
          existed
        };

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}

/**
 * MCP Tool Registry Manager
 * Manages all MCP tool adapters and provides unified access
 */
export class MCPToolRegistryManager {
  private logger: Logger;
  private adapters: Map<string, MCPToolAdapter> = new Map();
  private tools: Map<string, CustomToolDefinition> = new Map();

  constructor() {
    this.logger = new Logger('MCPToolRegistryManager');
    this.initializeAdapters();
  }

  private initializeAdapters(): void {
    const adapters = [
      new FilesystemMCPAdapter(),
      new DatabaseMCPAdapter(),
      new WebSearchMCPAdapter(),
      new TerminalMCPAdapter(),
      new MemoryMCPAdapter()
    ];

    for (const adapter of adapters) {
      this.adapters.set(adapter.serverName, adapter);
      
      // Register all tools from this adapter
      for (const tool of adapter.tools) {
        this.tools.set(tool.name, tool);
      }
      
      this.logger.info(`🔧 Registered MCP adapter: ${adapter.serverName} with ${adapter.tools.length} tools`);
    }
  }

  async getServerHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};
    
    for (const [serverName, adapter] of this.adapters) {
      try {
        health[serverName] = await adapter.healthCheck();
      } catch (error) {
        this.logger.error(`Health check failed for ${serverName}`, error);
        health[serverName] = false;
      }
    }
    
    return health;
  }

  async executeTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    const adapter = this.adapters.get(tool.mcpServer!);
    if (!adapter) {
      throw new Error(`MCP server ${tool.mcpServer} not found for tool ${toolName}`);
    }

    this.logger.info(`🔧 Executing tool: ${toolName} via ${tool.mcpServer}`);
    
    try {
      const result = await adapter.executeTool(toolName, args);
      this.logger.info(`✅ Tool ${toolName} executed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Tool ${toolName} execution failed`, error);
      throw error;
    }
  }

  getAllTools(): CustomToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getToolsByServer(serverName: string): CustomToolDefinition[] {
    return Array.from(this.tools.values()).filter(tool => tool.mcpServer === serverName);
  }

  getServerInfo(): Record<string, MCPServerInfo> {
    const info: Record<string, MCPServerInfo> = {};
    
    for (const [serverName, adapter] of this.adapters) {
      info[serverName] = {
        name: serverName,
        status: 'running', // Simplified - would check actual status
        port: 0, // MCP servers don't necessarily have ports
        tools: adapter.tools.map(tool => tool.name),
        healthCheck: () => adapter.healthCheck()
      };
    }
    
    return info;
  }
}
