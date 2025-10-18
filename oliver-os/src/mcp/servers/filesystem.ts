/**
 * Filesystem MCP Server for Oliver-OS
 * Provides file operations and project management capabilities
 */

import { EventEmitter } from 'node:events';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Logger } from '../../core/logger';
import type { MCPTool, MCPResource, MCPRequest, MCPResponse, OliverOSMCPServer } from '../types';

export class FilesystemMCPServer extends EventEmitter implements OliverOSMCPServer {
  private logger: Logger;
  public config: any;
  private isRunning: boolean = false;
  private basePath: string;

  constructor(basePath: string = process.cwd()) {
    super();
    this.logger = new Logger('Filesystem-MCP-Server');
    this.basePath = path.resolve(basePath);
    this.config = this.createServerConfig();
  }

  private createServerConfig() {
    return {
      name: 'filesystem-mcp-server',
      version: '1.0.0',
      description: 'Filesystem MCP Server for file operations and project management',
      port: 4002,
      host: 'localhost',
      tools: this.createTools(),
      resources: this.createResources()
    };
  }

  private createTools(): MCPTool[] {
    return [
      {
        name: 'fs_read_file',
        description: 'Read contents of a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file to read' },
            encoding: { type: 'string', default: 'utf8', description: 'File encoding' }
          },
          required: ['path']
        },
        handler: this.handleReadFile.bind(this)
      },
      {
        name: 'fs_write_file',
        description: 'Write contents to a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file to write' },
            content: { type: 'string', description: 'Content to write to the file' },
            encoding: { type: 'string', default: 'utf8', description: 'File encoding' },
            create_dirs: { type: 'boolean', default: true, description: 'Create parent directories if they don\'t exist' }
          },
          required: ['path', 'content']
        },
        handler: this.handleWriteFile.bind(this)
      },
      {
        name: 'fs_list_directory',
        description: 'List contents of a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the directory to list' },
            recursive: { type: 'boolean', default: false, description: 'List recursively' },
            include_hidden: { type: 'boolean', default: false, description: 'Include hidden files' },
            filter: { type: 'string', description: 'Filter files by extension or pattern' }
          },
          required: ['path']
        },
        handler: this.handleListDirectory.bind(this)
      },
      {
        name: 'fs_create_directory',
        description: 'Create a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the directory to create' },
            recursive: { type: 'boolean', default: true, description: 'Create parent directories if they don\'t exist' }
          },
          required: ['path']
        },
        handler: this.handleCreateDirectory.bind(this)
      },
      {
        name: 'fs_delete_file',
        description: 'Delete a file or directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file or directory to delete' },
            recursive: { type: 'boolean', default: false, description: 'Delete directory recursively' }
          },
          required: ['path']
        },
        handler: this.handleDeleteFile.bind(this)
      },
      {
        name: 'fs_move_file',
        description: 'Move or rename a file or directory',
        inputSchema: {
          type: 'object',
          properties: {
            source: { type: 'string', description: 'Source path' },
            destination: { type: 'string', description: 'Destination path' }
          },
          required: ['source', 'destination']
        },
        handler: this.handleMoveFile.bind(this)
      },
      {
        name: 'fs_copy_file',
        description: 'Copy a file or directory',
        inputSchema: {
          type: 'object',
          properties: {
            source: { type: 'string', description: 'Source path' },
            destination: { type: 'string', description: 'Destination path' },
            recursive: { type: 'boolean', default: true, description: 'Copy directory recursively' }
          },
          required: ['source', 'destination']
        },
        handler: this.handleCopyFile.bind(this)
      },
      {
        name: 'fs_get_file_info',
        description: 'Get information about a file or directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file or directory' }
          },
          required: ['path']
        },
        handler: this.handleGetFileInfo.bind(this)
      },
      {
        name: 'fs_search_files',
        description: 'Search for files matching a pattern',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: 'Search pattern (glob or regex)' },
            directory: { type: 'string', description: 'Directory to search in', default: '.' },
            recursive: { type: 'boolean', default: true, description: 'Search recursively' },
            include_content: { type: 'boolean', default: false, description: 'Include file content in results' }
          },
          required: ['pattern']
        },
        handler: this.handleSearchFiles.bind(this)
      },
      {
        name: 'fs_watch_file',
        description: 'Watch a file or directory for changes',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to watch' },
            recursive: { type: 'boolean', default: false, description: 'Watch recursively' },
            events: { type: 'array', items: { type: 'string' }, default: ['change'], description: 'Events to watch for' }
          },
          required: ['path']
        },
        handler: this.handleWatchFile.bind(this)
      },
      {
        name: 'fs_get_project_structure',
        description: 'Get the structure of a project directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the project directory', default: '.' },
            max_depth: { type: 'number', default: 3, description: 'Maximum depth to traverse' },
            include_files: { type: 'boolean', default: true, description: 'Include files in structure' },
            include_dirs: { type: 'boolean', default: true, description: 'Include directories in structure' }
          }
        },
        handler: this.handleGetProjectStructure.bind(this)
      }
    ];
  }

  private createResources(): MCPResource[] {
    return [
      {
        uri: 'filesystem://project/package.json',
        name: 'Package.json',
        description: 'Project package.json file',
        mimeType: 'application/json',
        handler: this.handleGetPackageJson.bind(this)
      },
      {
        uri: 'filesystem://project/readme',
        name: 'README',
        description: 'Project README file',
        mimeType: 'text/markdown',
        handler: this.handleGetReadme.bind(this)
      },
      {
        uri: 'filesystem://project/structure',
        name: 'Project Structure',
        description: 'Current project directory structure',
        mimeType: 'application/json',
        handler: this.handleGetProjectStructureResource.bind(this)
      }
    ];
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Filesystem MCP Server is already running');
      return;
    }

    try {
      this.logger.info(`🚀 Starting Filesystem MCP Server on ${this.config.host}:${this.config.port}`);
      this.logger.info(`📁 Base path: ${this.basePath}`);
      this.logger.info(`📋 Available tools: ${this.config.tools.length}`);
      this.logger.info(`📚 Available resources: ${this.config.resources.length}`);
      
      this.isRunning = true;
      this.emit('started');
      
      this.logger.info('✅ Filesystem MCP Server started successfully');
    } catch (error) {
      this.logger.error('❌ Failed to start Filesystem MCP Server', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Filesystem MCP Server is not running');
      return;
    }

    try {
      this.logger.info('🛑 Stopping Filesystem MCP Server...');
      this.isRunning = false;
      this.emit('stopped');
      this.logger.info('✅ Filesystem MCP Server stopped successfully');
    } catch (error) {
      this.logger.error('❌ Failed to stop Filesystem MCP Server', error);
      throw error;
    }
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      this.logger.debug(`📨 Handling Filesystem MCP request: ${request.method}`);

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
      this.logger.error('❌ Error handling Filesystem MCP request', error);
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
      this.logger.error(`❌ Error executing Filesystem tool ${name}`, error);
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
      this.logger.error(`❌ Error reading Filesystem resource ${uri}`, error);
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
  private async handleReadFile(args: Record<string, unknown>): Promise<any> {
    const { path: filePath, encoding } = args;
    const fullPath = this.resolvePath(filePath as string);
    
    this.logger.info(`📖 Reading file: ${fullPath}`);
    
    try {
      const content = await fs.readFile(fullPath, encoding as string || 'utf8');
      const stats = await fs.stat(fullPath);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            path: fullPath,
            content: content.toString(),
            size: stats.size,
            encoding: encoding || 'utf8',
            lastModified: stats.mtime.toISOString(),
            created: stats.birthtime.toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error(`❌ Error reading file ${fullPath}`, error);
      return this.createErrorResult(`Failed to read file: ${error}`);
    }
  }

  private async handleWriteFile(args: Record<string, unknown>): Promise<any> {
    const { path: filePath, content, encoding, create_dirs } = args;
    const fullPath = this.resolvePath(filePath as string);
    
    this.logger.info(`✍️ Writing file: ${fullPath}`);
    
    try {
      if (create_dirs) {
        await fs.ensureDir(path.dirname(fullPath));
      }
      
      await fs.writeFile(fullPath, content as string, encoding as string || 'utf8');
      const stats = await fs.stat(fullPath);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            path: fullPath,
            size: stats.size,
            encoding: encoding || 'utf8',
            lastModified: stats.mtime.toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error(`❌ Error writing file ${fullPath}`, error);
      return this.createErrorResult(`Failed to write file: ${error}`);
    }
  }

  private async handleListDirectory(args: Record<string, unknown>): Promise<any> {
    const { path: dirPath, recursive, include_hidden, filter } = args;
    const fullPath = this.resolvePath(dirPath as string);
    
    this.logger.info(`📁 Listing directory: ${fullPath}`);
    
    try {
      const items = await this.listDirectory(fullPath, {
        recursive: recursive as boolean || false,
        includeHidden: include_hidden as boolean || false,
        filter: filter as string
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            path: fullPath,
            items,
            count: items.length,
            recursive: recursive || false
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error(`❌ Error listing directory ${fullPath}`, error);
      return this.createErrorResult(`Failed to list directory: ${error}`);
    }
  }

  private async handleCreateDirectory(args: Record<string, unknown>): Promise<any> {
    const { path: dirPath, recursive } = args;
    const fullPath = this.resolvePath(dirPath as string);
    
    this.logger.info(`📁 Creating directory: ${fullPath}`);
    
    try {
      await fs.ensureDir(fullPath);
      const stats = await fs.stat(fullPath);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            path: fullPath,
            created: stats.birthtime.toISOString(),
            recursive: recursive || true
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error(`❌ Error creating directory ${fullPath}`, error);
      return this.createErrorResult(`Failed to create directory: ${error}`);
    }
  }

  private async handleDeleteFile(args: Record<string, unknown>): Promise<any> {
    const { path: filePath, recursive } = args;
    const fullPath = this.resolvePath(filePath as string);
    
    this.logger.info(`🗑️ Deleting: ${fullPath}`);
    
    try {
      const stats = await fs.stat(fullPath);
      await fs.remove(fullPath);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            path: fullPath,
            type: stats.isDirectory() ? 'directory' : 'file',
            deleted: new Date().toISOString(),
            recursive: recursive || false
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error(`❌ Error deleting ${fullPath}`, error);
      return this.createErrorResult(`Failed to delete: ${error}`);
    }
  }

  private async handleMoveFile(args: Record<string, unknown>): Promise<any> {
    const { source, destination } = args;
    const sourcePath = this.resolvePath(source as string);
    const destPath = this.resolvePath(destination as string);
    
    this.logger.info(`📦 Moving: ${sourcePath} -> ${destPath}`);
    
    try {
      await fs.move(sourcePath, destPath);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            source: sourcePath,
            destination: destPath,
            moved: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error(`❌ Error moving ${sourcePath} to ${destPath}`, error);
      return this.createErrorResult(`Failed to move file: ${error}`);
    }
  }

  private async handleCopyFile(args: Record<string, unknown>): Promise<any> {
    const { source, destination, recursive } = args;
    const sourcePath = this.resolvePath(source as string);
    const destPath = this.resolvePath(destination as string);
    
    this.logger.info(`📋 Copying: ${sourcePath} -> ${destPath}`);
    
    try {
      await fs.copy(sourcePath, destPath, { recursive: recursive as boolean || true });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            source: sourcePath,
            destination: destPath,
            copied: new Date().toISOString(),
            recursive: recursive || true
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error(`❌ Error copying ${sourcePath} to ${destPath}`, error);
      return this.createErrorResult(`Failed to copy file: ${error}`);
    }
  }

  private async handleGetFileInfo(args: Record<string, unknown>): Promise<any> {
    const { path: filePath } = args;
    const fullPath = this.resolvePath(filePath as string);
    
    this.logger.info(`ℹ️ Getting file info: ${fullPath}`);
    
    try {
      const stats = await fs.stat(fullPath);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            path: fullPath,
            name: path.basename(fullPath),
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            permissions: stats.mode.toString(8),
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString(),
            accessed: stats.atime.toISOString(),
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile(),
            isSymbolicLink: stats.isSymbolicLink()
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error(`❌ Error getting file info ${fullPath}`, error);
      return this.createErrorResult(`Failed to get file info: ${error}`);
    }
  }

  private async handleSearchFiles(args: Record<string, unknown>): Promise<any> {
    const { pattern, directory, recursive, include_content } = args;
    const searchDir = this.resolvePath(directory as string || '.');
    
    this.logger.info(`🔍 Searching files: ${pattern} in ${searchDir}`);
    
    try {
      const results = await this.searchFiles(searchDir, pattern as string, {
        recursive: recursive as boolean || true,
        includeContent: include_content as boolean || false
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            pattern,
            directory: searchDir,
            results,
            count: results.length,
            recursive: recursive || true
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error(`❌ Error searching files ${pattern}`, error);
      return this.createErrorResult(`Failed to search files: ${error}`);
    }
  }

  private async handleWatchFile(args: Record<string, unknown>): Promise<any> {
    const { path: filePath, recursive, events } = args;
    const fullPath = this.resolvePath(filePath as string);
    
    this.logger.info(`👀 Watching: ${fullPath}`);
    
    try {
      // This would set up file watching
      const watchId = `watch_${Date.now()}`;
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            watchId,
            path: fullPath,
            events: events || ['change'],
            recursive: recursive || false,
            started: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error(`❌ Error watching ${fullPath}`, error);
      return this.createErrorResult(`Failed to watch file: ${error}`);
    }
  }

  private async handleGetProjectStructure(args: Record<string, unknown>): Promise<any> {
    const { path: projectPath, max_depth, include_files, include_dirs } = args;
    const fullPath = this.resolvePath(projectPath as string || '.');
    
    this.logger.info(`🏗️ Getting project structure: ${fullPath}`);
    
    try {
      const structure = await this.getProjectStructure(fullPath, {
        maxDepth: max_depth as number || 3,
        includeFiles: include_files as boolean || true,
        includeDirs: include_dirs as boolean || true
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            projectPath: fullPath,
            structure,
            maxDepth: max_depth || 3,
            generated: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error(`❌ Error getting project structure ${fullPath}`, error);
      return this.createErrorResult(`Failed to get project structure: ${error}`);
    }
  }

  // Resource Handlers
  private async handleGetPackageJson(): Promise<any> {
    const packageJsonPath = path.join(this.basePath, 'package.json');
    
    try {
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageData = JSON.parse(content);
      
      return {
        contents: [{
          uri: 'filesystem://project/package.json',
          mimeType: 'application/json',
          text: JSON.stringify(packageData, null, 2)
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: 'filesystem://project/package.json',
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Package.json not found' }, null, 2)
        }]
      };
    }
  }

  private async handleGetReadme(): Promise<any> {
    const readmeFiles = ['README.md', 'README.txt', 'README', 'readme.md'];
    
    for (const readmeFile of readmeFiles) {
      const readmePath = path.join(this.basePath, readmeFile);
      try {
        const content = await fs.readFile(readmePath, 'utf8');
        return {
          contents: [{
            uri: 'filesystem://project/readme',
            mimeType: 'text/markdown',
            text: content
          }]
        };
      } catch {
        // Continue to next file
      }
    }
    
    return {
      contents: [{
        uri: 'filesystem://project/readme',
        mimeType: 'text/markdown',
        text: '# No README found'
      }]
    };
  }

  private async handleGetProjectStructureResource(): Promise<any> {
    const structure = await this.getProjectStructure(this.basePath, {
      maxDepth: 3,
      includeFiles: true,
      includeDirs: true
    });
    
    return {
      contents: [{
        uri: 'filesystem://project/structure',
        mimeType: 'application/json',
        text: JSON.stringify(structure, null, 2)
      }]
    };
  }

  // Helper methods
  private resolvePath(inputPath: string): string {
    const resolved = path.resolve(this.basePath, inputPath);
    if (!resolved.startsWith(this.basePath)) {
      throw new Error('Path outside base directory not allowed');
    }
    return resolved;
  }

  private async listDirectory(dirPath: string, options: {
    recursive: boolean;
    includeHidden: boolean;
    filter?: string;
  }): Promise<Array<Record<string, unknown>>> {
    const items: Array<Record<string, unknown>> = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!options.includeHidden && entry.name.startsWith('.')) {
          continue;
        }
        
        const fullPath = path.join(dirPath, entry.name);
        const stats = await fs.stat(fullPath);
        
        const item: Record<string, unknown> = {
          name: entry.name,
          path: fullPath,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime.toISOString()
        };
        
        if (options.filter) {
          if (entry.name.includes(options.filter) || 
              (entry.isFile() && path.extname(entry.name) === options.filter)) {
            items.push(item);
          }
        } else {
          items.push(item);
        }
        
        if (options.recursive && entry.isDirectory()) {
          const subItems = await this.listDirectory(fullPath, options);
          items.push(...subItems);
        }
      }
    } catch (error) {
      this.logger.error(`Error listing directory ${dirPath}`, error);
    }
    
    return items;
  }

  private async searchFiles(dirPath: string, pattern: string, options: {
    recursive: boolean;
    includeContent: boolean;
  }): Promise<Array<Record<string, unknown>>> {
    const results: Array<Record<string, unknown>> = [];
    
    try {
      const items = await this.listDirectory(dirPath, {
        recursive: options.recursive,
        includeHidden: false
      });
      
      for (const item of items) {
        if (item.type === 'file' && item.name.includes(pattern)) {
          const result: Record<string, unknown> = {
            name: item.name,
            path: item.path,
            size: item.size,
            modified: item.modified
          };
          
          if (options.includeContent) {
            try {
              const content = await fs.readFile(item.path as string, 'utf8');
              result.content = content.substring(0, 1000); // Limit content preview
            } catch {
              result.content = 'Unable to read content';
            }
          }
          
          results.push(result);
        }
      }
    } catch (error) {
      this.logger.error(`Error searching files in ${dirPath}`, error);
    }
    
    return results;
  }

  private async getProjectStructure(dirPath: string, options: {
    maxDepth: number;
    includeFiles: boolean;
    includeDirs: boolean;
  }): Promise<Record<string, unknown>> {
    const structure: Record<string, unknown> = {
      name: path.basename(dirPath),
      path: dirPath,
      type: 'directory',
      children: []
    };
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.') && !entry.name.startsWith('.git')) {
          continue; // Skip hidden files except .git
        }
        
        const fullPath = path.join(dirPath, entry.name);
        const stats = await fs.stat(fullPath);
        
        if (entry.isDirectory()) {
          if (options.includeDirs) {
            const subStructure = await this.getProjectStructure(fullPath, {
              maxDepth: options.maxDepth - 1,
              includeFiles: options.includeFiles,
              includeDirs: options.includeDirs
            });
            (structure.children as Array<Record<string, unknown>>).push(subStructure);
          }
        } else if (entry.isFile() && options.includeFiles) {
          (structure.children as Array<Record<string, unknown>>).push({
            name: entry.name,
            path: fullPath,
            type: 'file',
            size: stats.size,
            modified: stats.mtime.toISOString()
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error building project structure for ${dirPath}`, error);
    }
    
    return structure;
  }

  private createErrorResult(message: string): any {
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
