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
  private logger: Logger;
  private isRunning: boolean = false;
  private requestHandler?: (request: MCPRequest) => Promise<MCPResponse>;

  constructor() {
    super();
    this.logger = new Logger('MCP-Transport');
    this.setupStdioHandlers();
  }

  private setupStdioHandlers(): void {
    if (typeof process !== 'undefined') {
      process.stdin.setEncoding('utf8');
      
      process.stdin.on('data', (data: string) => {
        this.handleInput(data);
      });

      process.stdin.on('end', () => {
        this.logger.info('📡 STDIN ended, stopping transport');
        this.stop();
      });

      process.on('SIGINT', () => {
        this.logger.info('📡 Received SIGINT, stopping transport');
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
          this.logger.debug(`📨 Received MCP request: ${request.method}`);
          
          if (this.requestHandler) {
            const response = await this.requestHandler(request);
            await this.sendResponse(response);
          }
        }
      }
    } catch (error) {
      this.logger.error('❌ Error handling input', error);
      await this.sendErrorResponse('parse-error', -32700, 'Parse error');
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Transport is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('📡 STDIO transport started');
    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Transport is not running');
      return;
    }

    this.isRunning = false;
    this.logger.info('📡 STDIO transport stopped');
    this.emit('stopped');
  }

  async sendResponse(response: MCPResponse): Promise<void> {
    try {
      const jsonResponse = JSON.stringify(response) + '\n';
      if (typeof process !== 'undefined') {
        process.stdout.write(jsonResponse);
      }
      this.logger.debug(`📤 Sent MCP response: ${response.id}`);
    } catch (error) {
      this.logger.error('❌ Error sending response', error);
    }
  }

  onRequest(callback: (request: MCPRequest) => Promise<MCPResponse>): void {
    this._requestHandler = callback;
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
  private logger: Logger;
  private isRunning: boolean = false;
  private _requestHandler?: (request: MCPRequest) => Promise<MCPResponse>;
  private ws?: any; // WebSocket instance

  constructor(private port: number = 3001) {
    super();
    this.logger = new Logger('MCP-WebSocket-Transport');
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('WebSocket transport is already running');
      return;
    }

    try {
      // This would be implemented with actual WebSocket server
      // For now, we'll use a placeholder
      this.logger.info(`📡 WebSocket transport started on port ${this.port}`);
      this.isRunning = true;
      this.emit('started');
    } catch (error) {
      this.logger.error('❌ Failed to start WebSocket transport', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('WebSocket transport is not running');
      return;
    }

    this.isRunning = false;
    this.logger.info('📡 WebSocket transport stopped');
    this.emit('stopped');
  }

  async sendResponse(response: MCPResponse): Promise<void> {
    try {
      if (this.ws) {
        this.ws.send(JSON.stringify(response));
        this.logger.debug(`📤 Sent MCP response via WebSocket: ${response.id}`);
      }
    } catch (error) {
      this.logger.error('❌ Error sending WebSocket response', error);
    }
  }

  onRequest(callback: (request: MCPRequest) => Promise<MCPResponse>): void {
    this._requestHandler = callback;
  }
}

export class HTTPTransport extends EventEmitter implements MCPTransport {
  private logger: Logger;
  private isRunning: boolean = false;
  private _requestHandler?: (request: MCPRequest) => Promise<MCPResponse>;
  private _server?: any; // HTTP server instance

  constructor(private port: number = 3002) {
    super();
    this.logger = new Logger('MCP-HTTP-Transport');
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('HTTP transport is already running');
      return;
    }

    try {
      // This would be implemented with actual HTTP server
      // For now, we'll use a placeholder
      this.logger.info(`📡 HTTP transport started on port ${this.port}`);
      this.isRunning = true;
      this.emit('started');
    } catch (error) {
      this.logger.error('❌ Failed to start HTTP transport', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('HTTP transport is not running');
      return;
    }

    this.isRunning = false;
    this.logger.info('📡 HTTP transport stopped');
    this.emit('stopped');
  }

  async sendResponse(response: MCPResponse): Promise<void> {
    // HTTP transport would send response in HTTP response
    this.logger.debug(`📤 Sent MCP response via HTTP: ${response.id}`);
  }

  onRequest(callback: (request: MCPRequest) => Promise<MCPResponse>): void {
    this._requestHandler = callback;
  }
}
