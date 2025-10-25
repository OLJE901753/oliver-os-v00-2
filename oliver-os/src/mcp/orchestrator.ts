/**
 * MCP Orchestrator for Oliver-OS
 * Manages and coordinates all MCP servers
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../core/logger';
import { OliverOSMCPServerImpl } from './server';
import { GitHubMCPServer } from './servers/github';
import { FilesystemMCPServer } from './servers/filesystem';
import type { MCPRequest } from './types';
import { DatabaseMCPServer } from './servers/database';
import { WebSearchMCPServer } from './servers/websearch';
import { TerminalMCPServer } from './servers/terminal';
import { MemoryMCPServer } from './servers/memory';
import type { OliverOSMCPServer } from './types';

export interface MCPServerInfo {
  name: string;
  server: OliverOSMCPServer;
  port: number;
  status: 'stopped' | 'starting' | 'running' | 'error';
  lastError?: string;
}

export class MCPOrchestrator extends EventEmitter {
  private _logger: Logger;
  private servers: Map<string, MCPServerInfo> = new Map();
  private isRunning: boolean = false;

  constructor() {
    super();
    this._logger = new Logger('MCP-Orchestrator');
    this.initializeServers();
  }

  private initializeServers(): void {
    // Core Oliver-OS MCP Server
    this.servers.set('oliver-os', {
      name: 'oliver-os',
      server: new OliverOSMCPServerImpl(new (require('../core/config').Config)()),
      port: 4000,
      status: 'stopped'
    });

    // GitHub MCP Server
    this.servers.set('github', {
      name: 'github',
      server: new GitHubMCPServer(),
      port: 4001,
      status: 'stopped'
    });

    // Filesystem MCP Server
    this.servers.set('filesystem', {
      name: 'filesystem',
      server: new FilesystemMCPServer(),
      port: 4002,
      status: 'stopped'
    });

    // Database MCP Server
    this.servers.set('database', {
      name: 'database',
      server: new DatabaseMCPServer(),
      port: 4003,
      status: 'stopped'
    });

    // Web Search MCP Server
    this.servers.set('websearch', {
      name: 'websearch',
      server: new WebSearchMCPServer(),
      port: 4004,
      status: 'stopped'
    });

    // Terminal MCP Server
    this.servers.set('terminal', {
      name: 'terminal',
      server: new TerminalMCPServer(),
      port: 4005,
      status: 'stopped'
    });

    // Memory MCP Server
    this.servers.set('memory', {
      name: 'memory',
      server: new MemoryMCPServer(),
      port: 4006,
      status: 'stopped'
    });

    this._logger.info(`🔧 Initialized ${this.servers.size} MCP servers`);
  }

  async startAll(): Promise<void> {
    if (this.isRunning) {
      this._logger.warn('MCP Orchestrator is already running');
      return;
    }

    this._logger.info('🚀 Starting all MCP servers...');
    this.isRunning = true;

    const startPromises = Array.from(this.servers.values()).map(serverInfo => 
      this._startServerInternal(serverInfo)
    );

    try {
      await Promise.allSettled(startPromises);
      
      const runningServers = Array.from(this.servers.values()).filter(s => s.status === 'running');
      const failedServers = Array.from(this.servers.values()).filter(s => s.status === 'error');
      
      this._logger.info(`✅ Started ${runningServers.length} MCP servers successfully`);
      if (failedServers.length > 0) {
        this._logger.warn(`⚠️ ${failedServers.length} servers failed to start`);
        failedServers.forEach(server => {
          this._logger.error(`❌ ${server.name}: ${server.lastError}`);
        });
      }
      
      this.emit('allStarted', { running: runningServers.length, failed: failedServers.length });
    } catch (error) {
      this._logger.error('❌ Failed to start MCP servers', error);
      this.emit('error', error);
      throw error;
    }
  }

  async stopAll(): Promise<void> {
    if (!this.isRunning) {
      this._logger.warn('MCP Orchestrator is not running');
      return;
    }

    this._logger.info('🛑 Stopping all MCP servers...');

    const stopPromises = Array.from(this.servers.values()).map(serverInfo => 
      this._stopServerInternal(serverInfo)
    );

    try {
      await Promise.allSettled(stopPromises);
      this.isRunning = false;
      
      const stoppedServers = Array.from(this.servers.values()).filter(s => s.status === 'stopped');
      this._logger.info(`✅ Stopped ${stoppedServers.length} MCP servers`);
      
      this.emit('allStopped');
    } catch (error) {
      this._logger.error('❌ Error stopping MCP servers', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown with proper cleanup
   */
  async shutdown(): Promise<void> {
    this._logger.info('🔄 Shutting down MCP Orchestrator...');
    
    try {
      // Stop all servers
      await this.stopAll();
      
      // Clean up event listeners
      this.removeAllListeners();
      
      // Clear server map
      this.servers.clear();
      
      this._logger.info('✅ MCP Orchestrator shutdown complete');
    } catch (error) {
      this._logger.error('❌ Error during shutdown', error);
      throw error;
    }
  }

  async startServer(serverName: string): Promise<void> {
    const serverInfo = this.servers.get(serverName);
    if (!serverInfo) {
      throw new Error(`Server not found: ${serverName}`);
    }

    await this._startServerInternal(serverInfo);
  }

  private async _startServerInternal(serverInfo: MCPServerInfo): Promise<void> {
    try {
      this._logger.info(`🚀 Starting ${serverInfo.name} MCP server on port ${serverInfo.port}`);
      serverInfo.status = 'starting';
      
      await serverInfo.server.start();
      serverInfo.status = 'running';
      delete serverInfo.lastError;
      
      this._logger.info(`✅ ${serverInfo.name} MCP server started successfully`);
      this.emit('serverStarted', serverInfo);
    } catch (error) {
      serverInfo.status = 'error';
      serverInfo.lastError = error instanceof Error ? error.message : 'Unknown error';
      
      this._logger.error(`❌ Failed to start ${serverInfo.name} MCP server`, error);
      this.emit('serverError', { server: serverInfo, error });
    }
  }

  async stopServer(serverName: string): Promise<void> {
    const serverInfo = this.servers.get(serverName);
    if (!serverInfo) {
      throw new Error(`Server not found: ${serverName}`);
    }

    await this._stopServerInternal(serverInfo);
  }

  private async _stopServerInternal(serverInfo: MCPServerInfo): Promise<void> {
    try {
      this._logger.info(`🛑 Stopping ${serverInfo.name} MCP server`);
      
      await serverInfo.server.stop();
      serverInfo.status = 'stopped';
      delete serverInfo.lastError;
      
      this._logger.info(`✅ ${serverInfo.name} MCP server stopped`);
      this.emit('serverStopped', serverInfo);
    } catch (error) {
      this._logger.error(`❌ Error stopping ${serverInfo.name} MCP server`, error);
      this.emit('serverError', { server: serverInfo, error });
    }
  }

  async restartServer(serverName: string): Promise<void> {
    this._logger.info(`🔄 Restarting ${serverName} MCP server`);
    await this.stopServer(serverName);
    await this.startServer(serverName);
  }

  getServer(serverName: string): MCPServerInfo | undefined {
    return this.servers.get(serverName);
  }

  getAllServers(): MCPServerInfo[] {
    return Array.from(this.servers.values());
  }

  getRunningServers(): MCPServerInfo[] {
    return Array.from(this.servers.values()).filter(s => s.status === 'running');
  }

  getServerStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const [name, serverInfo] of this.servers.entries()) {
      status[name] = {
        name: serverInfo.name,
        port: serverInfo.port,
        status: serverInfo.status,
        lastError: serverInfo.lastError,
        uptime: serverInfo.status === 'running' ? 'running' : 'stopped'
      };
    }
    
    return status;
  }

  async getServerHealth(): Promise<Record<string, any>> {
    const health: Record<string, any> = {};
    
    for (const [name, serverInfo] of this.servers.entries()) {
      try {
        if (serverInfo.status === 'running') {
          // Test server health by sending a simple request
          const testRequest: MCPRequest = {
            jsonrpc: '2.0' as const,
            id: 'health-check',
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              clientInfo: { name: 'health-check', version: '1.0.0' }
            }
          };
          
          await serverInfo.server.handleRequest(testRequest);
          health[name] = {
            status: 'healthy',
            response_time: '0ms', // Would measure actual response time
            last_check: new Date().toISOString()
          };
        } else {
          health[name] = {
            status: 'unhealthy',
            reason: serverInfo.lastError || 'Server not running',
            last_check: new Date().toISOString()
          };
        }
      } catch (error) {
        health[name] = {
          status: 'unhealthy',
          reason: error instanceof Error ? error.message : 'Unknown error',
          last_check: new Date().toISOString()
        };
      }
    }
    
    return health;
  }

  async executeCommand(serverName: string, command: string, args: Record<string, unknown> = {}): Promise<any> {
    const serverInfo = this.servers.get(serverName);
    if (!serverInfo) {
      throw new Error(`Server not found: ${serverName}`);
    }

    if (serverInfo.status !== 'running') {
      throw new Error(`Server ${serverName} is not running`);
    }

    const request: MCPRequest = {
      jsonrpc: '2.0' as const,
      id: `cmd-${Date.now()}`,
      method: 'tools/call',
      params: {
        name: command,
        arguments: args
      }
    };

    return await serverInfo.server.handleRequest(request);
  }

  async getServerTools(serverName: string): Promise<any> {
    const serverInfo = this.servers.get(serverName);
    if (!serverInfo) {
      throw new Error(`Server not found: ${serverName}`);
    }

    const request: MCPRequest = {
      jsonrpc: '2.0' as const,
      id: `tools-${Date.now()}`,
      method: 'tools/list'
    };

    return await serverInfo.server.handleRequest(request);
  }

  async getServerResources(serverName: string): Promise<any> {
    const serverInfo = this.servers.get(serverName);
    if (!serverInfo) {
      throw new Error(`Server not found: ${serverName}`);
    }

    const request: MCPRequest = {
      jsonrpc: '2.0' as const,
      id: `resources-${Date.now()}`,
      method: 'resources/list'
    };

    return await serverInfo.server.handleRequest(request);
  }

  // Convenience methods for common operations
  async searchAllServers(query: string): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    for (const [name, serverInfo] of this.servers.entries()) {
      if (serverInfo.status === 'running') {
        try {
          // Try to search using available tools
          const toolsResponse = await this.getServerTools(name);
          if (toolsResponse.result?.tools) {
            const searchTools = toolsResponse.result.tools.filter((tool: any) => 
              tool.name.includes('search') || tool.name.includes('find')
            );
            
            if (searchTools.length > 0) {
              const searchTool = searchTools[0]!;
              const searchResult = await this.executeCommand(name, searchTool.name, { query });
              results[name] = searchResult;
            }
          }
        } catch (error) {
          this._logger.warn(`Search failed for ${name}:`, { error: String(error) });
        }
      }
    }
    
    return results;
  }

  async getSystemOverview(): Promise<any> {
    const overview = {
      orchestrator: {
        status: this.isRunning ? 'running' : 'stopped',
        total_servers: this.servers.size,
        running_servers: this.getRunningServers().length
      },
      servers: this.getServerStatus(),
      health: await this.getServerHealth(),
      timestamp: new Date().toISOString()
    };
    
    return overview;
  }

  // Event handlers
  override on(event: 'serverStarted', listener: (server: MCPServerInfo) => void): this;
  override on(event: 'serverStopped', listener: (server: MCPServerInfo) => void): this;
  override on(event: 'serverError', listener: (data: { server: MCPServerInfo; error: any }) => void): this;
  override on(event: 'allStarted', listener: (data: { running: number; failed: number }) => void): this;
  override on(event: 'allStopped', listener: () => void): this;
  override on(event: 'error', listener: (error: any) => void): this;
  override on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
}

// CLI interface for the orchestrator
export async function main() {
  const orchestrator = new MCPOrchestrator();
  
  try {
    const command = process.argv[2]! || 'start';
    
    switch (command) {
      case 'start':
        await orchestrator.startAll();
        console.log('🎉 All MCP servers started successfully!');
        break;
      case 'stop':
        await orchestrator.stopAll();
        console.log('🛑 All MCP servers stopped');
        break;
      case 'status':
        const status = orchestrator.getServerStatus();
        console.log('📊 MCP Server Status:');
        console.log(JSON.stringify(status, null, 2));
        break;
      case 'health':
        const health = await orchestrator.getServerHealth();
        console.log('🏥 MCP Server Health:');
        console.log(JSON.stringify(health, null, 2));
        break;
      case 'restart':
        const serverName = process.argv[3]!;
        if (serverName) {
          await orchestrator.restartServer(serverName);
          console.log(`🔄 ${serverName} server restarted`);
        } else {
          console.log('❌ Please specify server name to restart');
        }
        break;
      default:
        console.log('Available commands: start, stop, status, health, restart <server>');
    }
    
    if (command === 'start') {
      // Keep the process running
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down MCP servers...');
        await orchestrator.stopAll();
        process.exit(0);
      });
      
      // Keep alive
      setInterval(() => {
        // Heartbeat
      }, 30000);
    }
    
  } catch (error) {
    console.error('❌ MCP Orchestrator error:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]!}`) {
  main().catch(console.error);
}
