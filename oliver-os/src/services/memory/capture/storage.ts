/**
 * Memory Capture Storage
 * SQLite storage for raw memory captures
 * Following BMAD principles: Break, Map, Automate, Document
 */

import Database from 'better-sqlite3';
import { Logger } from '../../../core/logger';
import path from 'node:path';
import fs from 'fs-extra';

export type MemoryType = 'text' | 'voice' | 'email';
export type MemoryStatus = 'raw' | 'processing' | 'organized' | 'linked';

export interface MemoryRecord {
  id: string;
  rawContent: string;
  type: MemoryType;
  timestamp: Date;
  status: MemoryStatus;
  metadata: Record<string, unknown>;
  audioUrl?: string;
  transcript?: string;
  durationSeconds?: number;
}

export interface ProcessingQueueItem {
  id: string;
  memoryId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  error?: string;
  createdAt: Date;
}

export class MemoryStorage {
  private db: Database.Database;
  private logger: Logger;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.logger = new Logger('MemoryStorage');
    this.dbPath = dbPath || path.join(process.cwd(), 'data', 'memories.db');
    
    // Ensure data directory exists
    const dbDir = path.dirname(this.dbPath);
    fs.ensureDirSync(dbDir);
    
    // Initialize database
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    
    this.initializeSchema();
  }

  private initializeSchema(): void {
    // Create memories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        raw_content TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('text', 'voice', 'email')),
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'raw' CHECK(status IN ('raw', 'processing', 'organized', 'linked')),
        metadata TEXT NOT NULL DEFAULT '{}',
        audio_url TEXT,
        transcript TEXT,
        duration_seconds INTEGER,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_memories_status ON memories(status);
      CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
    `);

    // Create FTS5 virtual table for full-text search
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
        id UNINDEXED,
        raw_content,
        transcript,
        content='memories',
        content_rowid='rowid'
      );

      -- Trigger to keep FTS5 in sync
      CREATE TRIGGER IF NOT EXISTS memories_fts_insert AFTER INSERT ON memories BEGIN
        INSERT INTO memories_fts(rowid, id, raw_content, transcript) 
        VALUES (new.rowid, new.id, new.raw_content, COALESCE(new.transcript, ''));
      END;

      CREATE TRIGGER IF NOT EXISTS memories_fts_update AFTER UPDATE ON memories BEGIN
        UPDATE memories_fts SET 
          raw_content = new.raw_content,
          transcript = COALESCE(new.transcript, '')
        WHERE rowid = new.rowid;
      END;

      CREATE TRIGGER IF NOT EXISTS memories_fts_delete AFTER DELETE ON memories BEGIN
        DELETE FROM memories_fts WHERE rowid = old.rowid;
      END;

      -- Populate FTS5 with existing data (if any)
      INSERT OR IGNORE INTO memories_fts(rowid, id, raw_content, transcript)
      SELECT rowid, id, raw_content, COALESCE(transcript, '')
      FROM memories;
    `);

    // Create processing queue table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS processing_queue (
        id TEXT PRIMARY KEY,
        memory_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
        attempts INTEGER NOT NULL DEFAULT 0,
        error TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_queue_status ON processing_queue(status);
      CREATE INDEX IF NOT EXISTS idx_queue_memory_id ON processing_queue(memory_id);
    `);

    this.logger.info('Memory storage schema initialized');
  }

  /**
   * Create a new memory record
   */
  createMemory(memory: Omit<MemoryRecord, 'id' | 'timestamp'>): MemoryRecord {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    const stmt = this.db.prepare(`
      INSERT INTO memories (id, raw_content, type, timestamp, status, metadata, audio_url, transcript, duration_seconds)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      memory.rawContent,
      memory.type,
      timestamp.toISOString(),
      memory.status || 'raw',
      JSON.stringify(memory.metadata || {}),
      memory.audioUrl || null,
      memory.transcript || null,
      memory.durationSeconds || null
    );

    this.logger.debug(`Created memory: ${id}`);

    return {
      id,
      ...memory,
      timestamp,
    };
  }

  /**
   * Get a memory by ID
   */
  getMemory(id: string): MemoryRecord | null {
    const stmt = this.db.prepare('SELECT * FROM memories WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) {
      return null;
    }

    return this.rowToMemory(row);
  }

  /**
   * Update memory status
   */
  updateMemoryStatus(id: string, status: MemoryStatus): boolean {
    const stmt = this.db.prepare(`
      UPDATE memories 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    const result = stmt.run(status, id);
    return result.changes > 0;
  }

  /**
   * Update memory metadata
   */
  updateMemory(id: string, updates: Partial<MemoryRecord>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?');
      values.push(JSON.stringify(updates.metadata));
    }
    if (updates.transcript !== undefined) {
      fields.push('transcript = ?');
      values.push(updates.transcript);
    }
    if (updates.audioUrl !== undefined) {
      fields.push('audio_url = ?');
      values.push(updates.audioUrl);
    }
    if (updates.durationSeconds !== undefined) {
      fields.push('duration_seconds = ?');
      values.push(updates.durationSeconds);
    }

    if (fields.length === 0) {
      return false;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE memories 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  }

  /**
   * Get recent memories
   */
  getRecentMemories(limit: number = 10): MemoryRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM memories 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];
    return rows.map(row => this.rowToMemory(row));
  }

  /**
   * Get memories by status
   */
  getMemoriesByStatus(status: MemoryStatus): MemoryRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM memories 
      WHERE status = ? 
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(status) as any[];
    return rows.map(row => this.rowToMemory(row));
  }

  /**
   * Get timeline (chronological view)
   */
  getTimeline(startDate?: Date, endDate?: Date): MemoryRecord[] {
    let query = 'SELECT * FROM memories WHERE 1=1';
    const params: any[] = [];

    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate.toISOString());
    }
    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate.toISOString());
    }

    query += ' ORDER BY timestamp DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.rowToMemory(row));
  }

  /**
   * Add item to processing queue
   */
  addToQueue(memoryId: string): string {
    const id = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const stmt = this.db.prepare(`
      INSERT INTO processing_queue (id, memory_id, status)
      VALUES (?, ?, 'pending')
    `);

    stmt.run(id, memoryId);
    this.logger.debug(`Added to queue: ${id} for memory ${memoryId}`);
    
    return id;
  }

  /**
   * Get pending queue items
   */
  getPendingQueueItems(limit: number = 10): ProcessingQueueItem[] {
    const stmt = this.db.prepare(`
      SELECT * FROM processing_queue 
      WHERE status = 'pending' 
      ORDER BY created_at ASC 
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];
    return rows.map(this.rowToQueueItem);
  }

  /**
   * Update queue item status
   */
  updateQueueStatus(id: string, status: ProcessingQueueItem['status'], error?: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE processing_queue 
      SET status = ?, attempts = attempts + 1, error = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    const result = stmt.run(status, error || null, id);
    return result.changes > 0;
  }

  /**
   * Get queue item by memory ID
   */
  getQueueItemByMemoryId(memoryId: string): ProcessingQueueItem | null {
    const stmt = this.db.prepare('SELECT * FROM processing_queue WHERE memory_id = ? ORDER BY created_at DESC LIMIT 1');
    const row = stmt.get(memoryId) as any;

    return row ? this.rowToQueueItem(row) : null;
  }

  /**
   * Convert database row to MemoryRecord
   */
  private rowToMemory(row: any): MemoryRecord {
    return {
      id: row.id,
      rawContent: row.raw_content,
      type: row.type as MemoryType,
      timestamp: new Date(row.timestamp),
      status: row.status as MemoryStatus,
      metadata: JSON.parse(row.metadata || '{}'),
      audioUrl: row.audio_url || undefined,
      transcript: row.transcript || undefined,
      durationSeconds: row.duration_seconds || undefined,
    };
  }

  /**
   * Convert database row to ProcessingQueueItem
   */
  private rowToQueueItem(row: any): ProcessingQueueItem {
    return {
      id: row.id,
      memoryId: row.memory_id,
      status: row.status as ProcessingQueueItem['status'],
      attempts: row.attempts,
      error: row.error || undefined,
      createdAt: new Date(row.created_at),
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    this.logger.info('Memory storage connection closed');
  }

  /**
   * Get database statistics
   */
  getStats(): {
    totalMemories: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    pendingQueueItems: number;
  } {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM memories');
    const totalMemories = (totalStmt.get() as any).count;

    const statusStmt = this.db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM memories 
      GROUP BY status
    `);
    const statusRows = statusStmt.all() as any[];
    const byStatus: Record<string, number> = {};
    for (const row of statusRows) {
      byStatus[row.status] = row.count;
    }

    const typeStmt = this.db.prepare(`
      SELECT type, COUNT(*) as count 
      FROM memories 
      GROUP BY type
    `);
    const typeRows = typeStmt.all() as any[];
    const byType: Record<string, number> = {};
    for (const row of typeRows) {
      byType[row.type] = row.count;
    }

    const pendingStmt = this.db.prepare('SELECT COUNT(*) as count FROM processing_queue WHERE status = "pending"');
    const pendingQueueItems = (pendingStmt.get() as any).count;

    return {
      totalMemories,
      byStatus,
      byType,
      pendingQueueItems,
    };
  }
}

