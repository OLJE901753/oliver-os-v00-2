/**
 * Memory Capture Search
 * Full-text search using SQLite FTS5
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Logger } from '../../../core/logger';
import type { MemoryStorage, MemoryRecord } from './storage';

export interface SearchResult extends MemoryRecord {
  relevance: number;
  excerpt: string;
}

export class MemorySearch {
  private storage: MemoryStorage;
  private logger: Logger;

  constructor(storage: MemoryStorage) {
    this.storage = storage;
    this.logger = new Logger('MemorySearch');
  }

  /**
   * Full-text search across memories
   */
  search(query: string, limit: number = 50): SearchResult[] {
    const db = (this.storage as any).db;
    
    if (!db) {
      this.logger.error('Database not available');
      return [];
    }

    try {
      // Use FTS5 search (simplified - bm25 may not be available in all SQLite versions)
      const searchStmt = db.prepare(`
        SELECT 
          m.*,
          ROWID as relevance
        FROM memories_fts
        JOIN memories m ON memories_fts.rowid = m.rowid
        WHERE memories_fts MATCH ?
        ORDER BY m.timestamp DESC
        LIMIT ?
      `);

      const rows = searchStmt.all(query, limit) as any[];

      // Get excerpts using snippet() function
      const excerptStmt = db.prepare(`
        SELECT 
          snippet(memories_fts, 2, '<mark>', '</mark>', '...', 32) as excerpt,
          id
        FROM memories_fts
        WHERE memories_fts MATCH ?
      `);

      const excerptMap = new Map<string, string>();
      const excerptRows = excerptStmt.all(query) as any[];
      for (const row of excerptRows) {
        excerptMap.set(row.id, row.excerpt);
      }

      // Convert to SearchResult format
      const results: SearchResult[] = [];
      for (const row of rows) {
        const memory = this.rowToMemory(row);
        results.push({
          ...memory,
          relevance: row.relevance || 0,
          excerpt: excerptMap.get(memory.id) || memory.rawContent.substring(0, 200),
        });
      }

      this.logger.debug(`Search for "${query}" returned ${results.length} results`);
      return results;
    } catch (error) {
      this.logger.error(`Search failed: ${error}`);
      // Fallback to simple LIKE search
      return this.fallbackSearch(query, limit);
    }
  }

  /**
   * Fallback search using LIKE (if FTS5 fails)
   */
  private fallbackSearch(query: string, limit: number): SearchResult[] {
    const db = (this.storage as any).db;
    const searchTerm = `%${query}%`;

    const stmt = db.prepare(`
      SELECT * FROM memories 
      WHERE raw_content LIKE ? OR transcript LIKE ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const rows = stmt.all(searchTerm, searchTerm, limit) as any[];
    
    return rows.map((row: any) => {
      const memory = this.rowToMemory(row);
      const content = memory.transcript || memory.rawContent;
      const index = content.toLowerCase().indexOf(query.toLowerCase());
      const start = Math.max(0, index - 50);
      const end = Math.min(content.length, index + query.length + 50);
      const excerpt = (start > 0 ? '...' : '') + 
                     content.substring(start, end) + 
                     (end < content.length ? '...' : '');

      return {
        ...memory,
        relevance: 0.5, // Default relevance for fallback
        excerpt,
      };
    });
  }

  /**
   * Search with filters
   */
  searchWithFilters(
    query: string,
    filters: {
      type?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 50
  ): SearchResult[] {
    const db = (this.storage as any).db;

    try {
      let sql = `
        SELECT 
          m.*,
          m.timestamp as relevance
        FROM memories_fts
        JOIN memories m ON memories_fts.rowid = m.rowid
        WHERE memories_fts MATCH ?
      `;

      const params: any[] = [query];

      if (filters.type) {
        sql += ' AND m.type = ?';
        params.push(filters.type);
      }

      if (filters.status) {
        sql += ' AND m.status = ?';
        params.push(filters.status);
      }

      if (filters.startDate) {
        sql += ' AND m.timestamp >= ?';
        params.push(filters.startDate.toISOString());
      }

      if (filters.endDate) {
        sql += ' AND m.timestamp <= ?';
        params.push(filters.endDate.toISOString());
      }

      sql += ' ORDER BY m.timestamp DESC LIMIT ?';
      params.push(limit);

      const stmt = db.prepare(sql);
      const rows = stmt.all(...params) as any[];

      // Get excerpts
      const excerptStmt = db.prepare(`
        SELECT 
          snippet(memories_fts, 2, '<mark>', '</mark>', '...', 32) as excerpt,
          id
        FROM memories_fts
        WHERE memories_fts MATCH ?
      `);

      const excerptMap = new Map<string, string>();
      const excerptRows = excerptStmt.all(query) as any[];
      for (const row of excerptRows) {
        excerptMap.set(row.id, row.excerpt);
      }

      return rows.map((row: any) => {
        const memory = this.rowToMemory(row);
        return {
          ...memory,
          relevance: row.relevance || 0,
          excerpt: excerptMap.get(memory.id) || memory.rawContent.substring(0, 200),
        };
      });
    } catch (error) {
      this.logger.error(`Filtered search failed: ${error}`);
      return [];
    }
  }

  /**
   * Convert database row to MemoryRecord
   */
  private rowToMemory(row: any): MemoryRecord {
    return {
      id: row.id,
      rawContent: row.raw_content,
      type: row.type,
      timestamp: new Date(row.timestamp),
      status: row.status,
      metadata: JSON.parse(row.metadata || '{}'),
      audioUrl: row.audio_url || undefined,
      transcript: row.transcript || undefined,
      durationSeconds: row.duration_seconds || undefined,
    };
  }
}

