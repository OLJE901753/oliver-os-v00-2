/**
 * Memory Capture Service
 * Captures and stores all raw user inputs before AI processing
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../../core/logger';
import { Config } from '../../../core/config';
import { MemoryStorage, type MemoryRecord, type MemoryType, type MemoryStatus } from './storage';
import { MemoryQueue, type QueueProcessor } from './queue';
import { MemorySearch } from './search';
import path from 'node:path';
import fs from 'fs-extra';
import { z } from 'zod';

// Validation schemas
const MemoryCaptureSchema = z.object({
  rawContent: z.string().min(1),
  type: z.enum(['text', 'voice', 'email']),
  metadata: z.record(z.unknown()).optional(),
  audioUrl: z.string().url().optional(),
  transcript: z.string().optional(),
  durationSeconds: z.number().positive().optional(),
});

export interface MemoryCaptureInput {
  rawContent: string;
  type: MemoryType;
  metadata?: Record<string, unknown>;
  audioUrl?: string;
  transcript?: string;
  durationSeconds?: number;
}

export class CaptureMemoryService extends EventEmitter implements QueueProcessor {
  private _logger: Logger;
  private _config: Config;
  private storage: MemoryStorage;
  private queue: MemoryQueue;
  private search: MemorySearch;
  private isInitialized: boolean = false;

  constructor(config: Config) {
    super();
    this._config = config;
    this._logger = new Logger('CaptureMemoryService');
    
    // Initialize storage
    const dbPath = config.get('memory.dbPath') || path.join(process.cwd(), 'data', 'memories.db');
    this.storage = new MemoryStorage(dbPath);
    
    // Initialize queue and search
    this.queue = new MemoryQueue(this.storage);
    this.queue.setProcessor(this); // This service processes queue items
    this.search = new MemorySearch(this.storage);

    // Forward queue events
    this.queue.on('queue:completed', (item) => this.emit('memory:processed', item));
    this.queue.on('queue:failed', (item) => this.emit('memory:processing_failed', item));
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this._logger.warn('Capture Memory Service already initialized');
      return;
    }

    this._logger.info('🧠 Initializing Memory Capture Service...');

    try {
      // Start queue processing
      const intervalMs = this._config.get('memory.queueInterval', 5000);
      this.queue.start(intervalMs);

      this.isInitialized = true;
      this._logger.info('✅ Memory Capture Service initialized successfully');
      this.emit('initialized');
    } catch (error) {
      this._logger.error('Failed to initialize Memory Capture Service:', error);
      throw error;
    }
  }

  /**
   * Capture a new memory
   */
  async captureMemory(input: MemoryCaptureInput): Promise<MemoryRecord> {
    try {
      // Validate input
      const validated = MemoryCaptureSchema.parse(input);

      // Create memory record
      const memory = this.storage.createMemory({
        rawContent: validated.rawContent,
        type: validated.type,
        status: 'raw',
        metadata: validated.metadata || {},
        audioUrl: validated.audioUrl,
        transcript: validated.transcript,
        durationSeconds: validated.durationSeconds,
      });

      this._logger.info(`Captured memory: ${memory.id} (${memory.type})`);

      // Add to processing queue
      const queueId = this.storage.addToQueue(memory.id);

      // Emit event for async processing
      this.emit('memory:captured', memory);

      this._logger.debug(`Added memory ${memory.id} to processing queue: ${queueId}`);

      return memory;
    } catch (error) {
      this._logger.error(`Failed to capture memory: ${error}`);
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Process a memory (implements QueueProcessor)
   */
  async process(memoryId: string): Promise<void> {
    const memory = this.storage.getMemory(memoryId);
    
    if (!memory) {
      throw new Error(`Memory not found: ${memoryId}`);
    }

    this._logger.debug(`Processing memory: ${memoryId}`);

    // Update status to processing
    this.storage.updateMemoryStatus(memoryId, 'processing');

    // Emit event for AI organization layer to handle
    // In a real implementation, this would trigger the Organizer Service
    this.emit('memory:processing', memory);

    // For now, just mark as organized (AI organization will be added later)
    // The Organizer Service will update this to 'organized' and then 'linked'
    this.storage.updateMemoryStatus(memoryId, 'organized');

    this._logger.debug(`Memory processing completed: ${memoryId}`);
  }

  /**
   * Get a memory by ID
   */
  async getMemory(id: string): Promise<MemoryRecord | null> {
    return this.storage.getMemory(id);
  }

  /**
   * Get recent memories
   */
  async getRecentMemories(limit: number = 10): Promise<MemoryRecord[]> {
    return this.storage.getRecentMemories(limit);
  }

  /**
   * Search memories
   */
  async searchMemories(query: string, limit: number = 50): Promise<MemoryRecord[]> {
    return this.search.search(query, limit);
  }

  /**
   * Get timeline
   */
  async getTimeline(startDate?: Date, endDate?: Date): Promise<MemoryRecord[]> {
    return this.storage.getTimeline(startDate, endDate);
  }

  /**
   * Get memories by status
   */
  async getMemoriesByStatus(status: MemoryStatus): Promise<MemoryRecord[]> {
    return this.storage.getMemoriesByStatus(status);
  }

  /**
   * Update memory status
   */
  async updateMemoryStatus(id: string, status: MemoryStatus): Promise<boolean> {
    return this.storage.updateMemoryStatus(id, status);
  }

  /**
   * Update memory metadata
   */
  async updateMemory(id: string, updates: Partial<MemoryRecord>): Promise<boolean> {
    return this.storage.updateMemory(id, updates);
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<{
    storage: ReturnType<MemoryStorage['getStats']>;
    queue: ReturnType<MemoryQueue['getStatus']>;
  }> {
    return {
      storage: this.storage.getStats(),
      queue: this.queue.getStatus(),
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; stats: any }> {
    try {
      const stats = await this.getStats();
      return {
        status: 'healthy',
        stats,
      };
    } catch (error) {
      this._logger.error(`Health check failed: ${error}`);
      return {
        status: 'unhealthy',
        stats: null,
      };
    }
  }

  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    this._logger.info('🛑 Shutting down Memory Capture Service...');
    
    this.queue.stop();
    this.storage.close();
    
    this.isInitialized = false;
    this.emit('shutdown');
  }
}

