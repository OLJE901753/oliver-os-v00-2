/**
 * MCP Server Entry Point for Oliver-OS
 * Main module for running MCP servers with different transport options
 */

import { Config } from '../core/config';
import { Logger } from '../core/logger';
import { OliverOSMCPServerImpl } from './server';
import { StdioTransport, WebSocketTransport, HTTPTransport } from './transport';
import type { MCPTransport } from './transport';

export class MCPManager {
  private _logger: Logger;
  private _config: Config;
  private mcpServer: OliverOSMCPServerImpl;
  private transport?: MCPTransport;

  constructor() {
    this._config = new Config();
    this._logger = new Logger('MCP-Manager');
    this.mcpServer = new OliverOSMCPServerImpl(this._config);
  }

  async initialize(): Promise<void> {
    try {
      await this._config.load();
      this._logger.info('✅ MCP Manager initialized');
    } catch (error) {
      this._logger.error('❌ Failed to initialize MCP Manager', error);
      throw error;
    }
  }

  async startWithStdio(): Promise<void> {
    this.transport = new StdioTransport();
    await this.startMCP();
  }

  async startWithWebSocket(port: number = 3001): Promise<void> {
    this.transport = new WebSocketTransport(port);
    await this.startMCP();
  }

  async startWithHTTP(port: number = 3002): Promise<void> {
    this.transport = new HTTPTransport(port);
    await this.startMCP();
  }

  private async startMCP(): Promise<void> {
    if (!this.transport) {
      throw new Error('No transport configured');
    }

    try {
      // Set up request handling
      this.transport.onRequest(async (request) => {
        return await this.mcpServer.handleRequest(request);
      });

      // Start transport
      await this.transport.start();

      // Start MCP server
      await this.mcpServer.start();

      this._logger.info('🚀 MCP Server started successfully');
    } catch (error) {
      this._logger.error('❌ Failed to start MCP Server', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      if (this.transport) {
        await this.transport.stop();
      }
      await this.mcpServer.stop();
      this._logger.info('🛑 MCP Server stopped');
    } catch (error) {
      this._logger.error('❌ Error stopping MCP Server', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const manager = new MCPManager();
  
  try {
    await manager.initialize();
    
    const transportType = process.argv[2]! || 'stdio';
    
    switch (transportType) {
      case 'stdio':
        await manager.startWithStdio();
        break;
      case 'websocket': {
        const wsPort = parseInt(process.argv[3]! || '3001');
        await manager.startWithWebSocket(wsPort);
        break;
      }
      case 'http': {
        const httpPort = parseInt(process.argv[3]! || '3002');
        await manager.startWithHTTP(httpPort);
        break;
      }
      default:
        console.error('❌ Unknown transport type. Use: stdio, websocket, or http');
        process.exit(1);
    }
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down MCP Server...');
      await manager.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start MCP Server:', error);
    process.exit(1);
  }
}

// Export for use as module
export { OliverOSMCPServerImpl, StdioTransport, WebSocketTransport, HTTPTransport };
export * from './types';

// Run if this is the main module
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]!}`) {
  main().catch(console.error);
}
