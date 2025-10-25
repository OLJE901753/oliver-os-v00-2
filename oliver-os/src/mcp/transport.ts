/**
 * MCP Transport Layer for Oliver-OS
 * Handles communication between MCP clients and the Oliver-OS server
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../core/logger';
import type { MCPRequest, MCPResponse } from './types';

export interface MCPTransport {
  start(): Promise<void>;
  stop(): Promise<void>;
  sendResponse(response: MCPResponse): Promise<void>;
  onRequest(callback: (request: MCPRequest) => Promise<MCPResponse>): void;
}

export class StdioTransport extends EventEmitter implements MCPTransport {
  private _logger: Logger;
  private isRunning: boolean = false;
  private requestHandler?: (request: MCPRequest) => Promise<MCPResponse>;

  constructor() {
    super();
    this._logger = new Logger('MCP-Transport');
    this.setupStdioHandlers();
  }

  private setupStdioHandlers(): void {
    if (typeof process !== 'undefined') {
      process.stdin.setEncoding('utf8');
      
      process.stdin.on('data', (data: string) => {
        this.handleInput(data);
      });

      process.stdin.on('end', () => {
        this._logger.info('📡 STDIN ended, stopping transport');
        this.stop();
      });

      process.on('SIGINT', () => {
        this._logger.info('📡 Received SIGINT, stopping transport');
        this.stop();
      });
    }
  }

  private async handleInput(data: string): Promise<void> {
    try {
      const lines = data.trim().split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          const request = JSON.parse(line) as MCPRequest;
          this._logger.debug(`📨 Received MCP request: ${request.method}`);
          
          if (this.requestHandler) {
            const response = await this.requestHandler(request);
            await this.sendResponse(response);
          }
        }
      }
    } catch (error) {
      this._logger.error('❌ Error handling input', error);
      await this.sendErrorResponse('parse-error', -32700, 'Parse error');
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this._logger.warn('Transport is already running');
      return;
    }

    this.isRunning = true;
    this._logger.info('📡 STDIO transport started');
    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this._logger.warn('Transport is not running');
      return;
    }

    this.isRunning = false;
    this._logger.info('📡 STDIO transport stopped');
    this.emit('stopped');
  }

  async sendResponse(response: MCPResponse): Promise<void> {
    try {
      const jsonResponse = `${JSON.stringify(response)  }\n`;
      if (typeof process !== 'undefined') {
        process.stdout.write(jsonResponse);
      }
      this._logger.debug(`📤 Sent MCP response: ${response.id}`);
    } catch (error) {
      this._logger.error('❌ Error sending response', error);
    }
  }

  onRequest(callback: (request: MCPRequest) => Promise<MCPResponse>): void {
    this.requestHandler = callback;
  }

  private async sendErrorResponse(id: string | number, code: number, message: string): Promise<void> {
    const errorResponse: MCPResponse = {
      jsonrpc: '2.0',
      id,
      error: { code, message }
    };
    await this.sendResponse(errorResponse);
  }
}

export class WebSocketTransport extends EventEmitter implements MCPTransport {
  private _logger: Logger;
  private isRunning: boolean = false;
  // private _requestHandler?: (request: MCPRequest) => Promise<MCPResponse>; // Unused - will be implemented in future
  private ws?: any; // WebSocket instance

  constructor(private port: number = 3001) {
    super();
    this._logger = new Logger('MCP-WebSocket-Transport');
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this._logger.warn('WebSocket transport is already running');
      return;
    }

    try {
      // This would be implemented with actual WebSocket server
      // For now, we'll use a placeholder
      this._logger.info(`📡 WebSocket transport started on port ${this.port}`);
      this.isRunning = true;
      this.emit('started');
    } catch (error) {
      this._logger.error('❌ Failed to start WebSocket transport', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this._logger.warn('WebSocket transport is not running');
      return;
    }

    this.isRunning = false;
    this._logger.info('📡 WebSocket transport stopped');
    this.emit('stopped');
  }

  async sendResponse(response: MCPResponse): Promise<void> {
    try {
      if (this.ws) {
        this.ws.send(JSON.stringify(response));
        this._logger.debug(`📤 Sent MCP response via WebSocket: ${response.id}`);
      }
    } catch (error) {
      this._logger.error('❌ Error sending WebSocket response', error);
    }
  }

  onRequest(_callback: (request: MCPRequest) => Promise<MCPResponse>): void {
    // Will be implemented in future iteration
    this._logger.debug('Request handler registered (not yet implemented)');
  }
}

export class HTTPTransport extends EventEmitter implements MCPTransport {
  private _logger: Logger;
  private isRunning: boolean = false;
  // private _requestHandler?: (request: MCPRequest) => Promise<MCPResponse>; // Unused - will be implemented in future
  // private _server?: any; // HTTP server instance // Unused - will be implemented in future

  constructor(private port: number = 3002) {
    super();
    this._logger = new Logger('MCP-HTTP-Transport');
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this._logger.warn('HTTP transport is already running');
      return;
    }

    try {
      // This would be implemented with actual HTTP server
      // For now, we'll use a placeholder
      this._logger.info(`📡 HTTP transport started on port ${this.port}`);
      this.isRunning = true;
      this.emit('started');
    } catch (error) {
      this._logger.error('❌ Failed to start HTTP transport', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this._logger.warn('HTTP transport is not running');
      return;
    }

    this.isRunning = false;
    this._logger.info('📡 HTTP transport stopped');
    this.emit('stopped');
  }

  async sendResponse(response: MCPResponse): Promise<void> {
    // HTTP transport would send response in HTTP response
    this._logger.debug(`📤 Sent MCP response via HTTP: ${response.id}`);
  }

  onRequest(_callback: (request: MCPRequest) => Promise<MCPResponse>): void {
    // Will be implemented in future iteration
    this._logger.debug('Request handler registered (not yet implemented)');
  }
}
