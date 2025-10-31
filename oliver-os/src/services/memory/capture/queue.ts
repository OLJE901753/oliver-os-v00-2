/**
 * Memory Capture Processing Queue
 * In-memory queue for async AI processing
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../../core/logger';
import type { MemoryStorage, ProcessingQueueItem } from './storage';

export interface QueueProcessor {
  process(memoryId: string): Promise<void>;
}

export class MemoryQueue extends EventEmitter {
  private storage: MemoryStorage;
  private logger: Logger;
  private queue: ProcessingQueueItem[] = [];
  private processing: Set<string> = new Set();
  private processor?: QueueProcessor;
  private maxAttempts: number = 3;
  private processingInterval?: NodeJS.Timeout;

  constructor(storage: MemoryStorage) {
    super();
    this.storage = storage;
    this.logger = new Logger('MemoryQueue');
  }

  /**
   * Set the processor function
   */
  setProcessor(processor: QueueProcessor): void {
    this.processor = processor;
    this.logger.info('Queue processor set');
  }

  /**
   * Start processing queue
   */
  start(intervalMs: number = 5000): void {
    if (this.processingInterval) {
      this.logger.warn('Queue processing already started');
      return;
    }

    this.logger.info(`Starting queue processing (interval: ${intervalMs}ms)`);
    
    this.processingInterval = setInterval(() => {
      this.processNext();
    }, intervalMs);

    // Process immediately
    this.processNext();
  }

  /**
   * Stop processing queue
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
      this.logger.info('Queue processing stopped');
    }
  }

  /**
   * Process next item in queue
   */
  private async processNext(): Promise<void> {
    if (!this.processor) {
      this.logger.debug('No processor set, skipping queue processing');
      return;
    }

    // Load pending items from storage
    const pendingItems = this.storage.getPendingQueueItems(10);
    
    for (const item of pendingItems) {
      if (this.processing.has(item.memoryId)) {
        continue; // Already processing
      }

      if (item.attempts >= this.maxAttempts) {
        this.logger.warn(`Max attempts reached for ${item.memoryId}, marking as failed`);
        this.storage.updateQueueStatus(item.id, 'failed', 'Max attempts exceeded');
        this.emit('queue:failed', item);
        continue;
      }

      // Process this item
      await this.processItem(item);
    }
  }

  /**
   * Process a queue item
   */
  private async processItem(item: ProcessingQueueItem): Promise<void> {
    this.processing.add(item.memoryId);
    this.storage.updateQueueStatus(item.id, 'processing');

    this.logger.debug(`Processing queue item: ${item.id} for memory ${item.memoryId}`);

    try {
      if (!this.processor) {
        throw new Error('No processor set');
      }

      await this.processor.process(item.memoryId);

      // Mark as completed
      this.storage.updateQueueStatus(item.id, 'completed');
      this.emit('queue:completed', item);
      this.logger.debug(`Queue item completed: ${item.id}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Queue processing failed for ${item.memoryId}: ${errorMessage}`);

      // Update with error
      this.storage.updateQueueStatus(item.id, 'failed', errorMessage);

      // Retry if attempts < max
      if (item.attempts + 1 < this.maxAttempts) {
        this.logger.debug(`Retrying ${item.memoryId} (attempt ${item.attempts + 1}/${this.maxAttempts})`);
        // Reset to pending for retry
        this.storage.updateQueueStatus(item.id, 'pending', errorMessage);
      } else {
        this.emit('queue:failed', { ...item, error: errorMessage });
      }
    } finally {
      this.processing.delete(item.memoryId);
    }
  }

  /**
   * Get queue status
   */
  getStatus(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    const db = (this.storage as any).db;
    
    const pendingStmt = db.prepare('SELECT COUNT(*) as count FROM processing_queue WHERE status = "pending"');
    const processingStmt = db.prepare('SELECT COUNT(*) as count FROM processing_queue WHERE status = "processing"');
    const completedStmt = db.prepare('SELECT COUNT(*) as count FROM processing_queue WHERE status = "completed"');
    const failedStmt = db.prepare('SELECT COUNT(*) as count FROM processing_queue WHERE status = "failed"');

    return {
      pending: (pendingStmt.get() as any).count,
      processing: (processingStmt.get() as any).count,
      completed: (completedStmt.get() as any).count,
      failed: (failedStmt.get() as any).count,
    };
  }
}

