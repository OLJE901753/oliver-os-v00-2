/**
 * Agent Bridge Service
 * Connects Python agent with TypeScript agents
 * Enables agent-to-agent communication
 */

import type { AgentMessage, AgentType } from '../services/multi-agent/types';
import { Logger } from '../core/logger';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export class AgentBridgeService {
  private logger: Logger;
  private requestWatcher?: AbortController;
  
  constructor() {
    this.logger = new Logger('AgentBridge');
  }
  
  /**
   * Watch for Python agent messages to Cursor
   * Returns the latest request when available
   */
  async watchForPythonMessages(
    callback: (request: Record<string, unknown>) => void | Promise<void>
  ): Promise<void> {
    const cursorRequestFile = join(process.cwd(), 'cursor-request.json');
    let lastModified = 0;
    
    this.requestWatcher = new AbortController();
    
    this.logger.info(`📡 Watching for Python agent messages at: ${cursorRequestFile}`);
    
    while (!this.requestWatcher.signal.aborted) {
      try {
        if (existsSync(cursorRequestFile)) {
          const stats = await import('fs').then(m => 
            m.promises.stat(cursorRequestFile)
          );
          
          if (stats.mtimeMs > lastModified) {
            lastModified = stats.mtimeMs;
            
            const data = await readFile(cursorRequestFile, 'utf-8');
            const request = JSON.parse(data);
            
            this.logger.info('📨 Received message from Python agent');
            await callback(request);
          }
        }
        
        // Poll every 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
          // File doesn't exist yet, that's OK
        } else if (error && typeof error === 'object' && 'message' in error) {
          this.logger.warn(`Error watching for messages: ${error.message}`);
        } else {
          this.logger.warn('Error watching for messages: Unknown error');
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  /**
   * Send message from Python agent to TypeScript agents
   */
  async sendToAgents(
    sender: string,
    messageType: string,
    content: Record<string, unknown>,
    recipient?: string
  ): Promise<void> {
    // Set recipient - always assign a value, never undefined
    const finalRecipient: AgentType | 'all' = (recipient || 'all') as AgentType | 'all';
    
    const message: AgentMessage = {
      id: `msg-${Date.now()}`,
      type: messageType as AgentMessage['type'],
      sender: sender as AgentMessage['sender'],
      recipient: finalRecipient,
      content,
      timestamp: new Date().toISOString(),
      priority: 'normal' as const
    };
    
    this.logger.info(`📤 Routing message from ${sender} to agents: ${recipient || 'all'}`);
    
    // Store message for the orchestrator to pick up
    const messageFile = join(process.cwd(), 'temp', 'agent-messages.jsonl');
    const messageJson = JSON.stringify(message);
    
    try {
      const fs = await import('fs').then(m => m.promises);
      await fs.mkdir(join(process.cwd(), 'temp'), { recursive: true });
      await fs.appendFile(messageFile, `${messageJson}\n`);
      
      this.logger.info(`✅ Message stored: ${message.id}`);
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Unknown error';
      this.logger.error(`Failed to store message: ${errorMessage}`);
      throw error;
    }
  }
  
  /**
   * Get latest request from Python agent
   */
  async getLatestRequest(): Promise<Record<string, unknown> | null> {
    try {
      const cursorRequestFile = join(process.cwd(), 'cursor-request.json');
      
      if (!existsSync(cursorRequestFile)) {
        return null;
      }
      
      const data = await readFile(cursorRequestFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.warn('Could not read cursor request file');
      return null;
    }
  }
  
  /**
   * Get Python agent context for Cursor
   */
  async getPythonAgentContext(): Promise<Record<string, unknown> | null> {
    try {
      const agentMemoryFile = join(
        process.cwd(), 
        'ai-services', 
        'memory', 
        'agent-memory.json'
      );
      
      if (!existsSync(agentMemoryFile)) {
        this.logger.warn('Agent memory file not found');
        return null;
      }
      
      const data = await readFile(agentMemoryFile, 'utf-8');
      return JSON.parse(data);
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Unknown error';
      this.logger.warn(`Could not load agent memory: ${errorMessage}`);
      return null;
    }
  }
  
  /**
   * Mark a request as processed
   */
  async markRequestAsProcessed(): Promise<void> {
    try {
      const cursorRequestFile = join(process.cwd(), 'cursor-request.json');
      
      if (existsSync(cursorRequestFile)) {
        // Rename or delete the file to mark it as processed
        await import('fs').then(m => 
          m.promises.rename(
            cursorRequestFile,
            `${cursorRequestFile}.processed.${Date.now()}`
          )
        );
        
        this.logger.info('Request marked as processed');
      }
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Unknown error';
      this.logger.warn(`Could not mark request as processed: ${errorMessage}`);
    }
  }
  
  /**
   * Destroy the watcher
   */
  destroy(): void {
    if (this.requestWatcher) {
      this.requestWatcher.abort();
      this.logger.info('Request watcher stopped');
    }
  }
}

// Export singleton instance
export const agentBridge = new AgentBridgeService();

