/**
 * Chat History Storage
 * SQLite storage for chat sessions and messages
 * Following BMAD principles: Break, Map, Automate, Document
 */

import Database from 'better-sqlite3';
import { Logger } from '../../core/logger';
import path from 'node:path';
import fs from 'fs-extra';

export interface ChatSession {
  id: string;
  userId: string;
  startedAt: Date;
  lastMessageAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  contextNodes: string[]; // JSON array of node IDs used
  createdAt: Date;
}

export class ChatHistoryStorage {
  private db: Database.Database;
  private logger: Logger;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.logger = new Logger('ChatHistoryStorage');
    this.dbPath = dbPath || path.join(process.cwd(), 'data', 'chat.db');
    
    // Ensure data directory exists
    const dbDir = path.dirname(this.dbPath);
    fs.ensureDirSync(dbDir);
    
    // Initialize database
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging
    
    this.initializeSchema();
  }

  /**
   * Initialize database schema
   */
  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        context_nodes TEXT NOT NULL DEFAULT '[]',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created ON chat_messages(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON chat_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_last_message ON chat_sessions(last_message_at DESC);
    `);
  }

  /**
   * Create a new chat session
   */
  createSession(userId: string = 'default'): ChatSession {
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    this.db.prepare(`
      INSERT INTO chat_sessions (id, user_id, started_at, last_message_at)
      VALUES (?, ?, ?, ?)
    `).run(id, userId, now.toISOString(), now.toISOString());

    return {
      id,
      userId,
      startedAt: now,
      lastMessageAt: now,
    };
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): ChatSession | null {
    const row = this.db.prepare(`
      SELECT * FROM chat_sessions WHERE id = ?
    `).get(sessionId) as any;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      userId: row.user_id,
      startedAt: new Date(row.started_at),
      lastMessageAt: new Date(row.last_message_at),
    };
  }

  /**
   * Update session last message time
   */
  updateSessionLastMessage(sessionId: string): void {
    this.db.prepare(`
      UPDATE chat_sessions 
      SET last_message_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(sessionId);
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string, limit: number = 50): ChatSession[] {
    const rows = this.db.prepare(`
      SELECT * FROM chat_sessions 
      WHERE user_id = ? 
      ORDER BY last_message_at DESC 
      LIMIT ?
    `).all(userId, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      startedAt: new Date(row.started_at),
      lastMessageAt: new Date(row.last_message_at),
    }));
  }

  /**
   * Add a message to a session
   */
  addMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    contextNodes: string[] = []
  ): ChatMessage {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    this.db.prepare(`
      INSERT INTO chat_messages (id, session_id, role, content, context_nodes, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      sessionId,
      role,
      content,
      JSON.stringify(contextNodes),
      now.toISOString()
    );

    // Update session last message time
    this.updateSessionLastMessage(sessionId);

    return {
      id,
      sessionId,
      role,
      content,
      contextNodes,
      createdAt: now,
    };
  }

  /**
   * Get messages for a session
   */
  getSessionMessages(sessionId: string, limit: number = 100): ChatMessage[] {
    const rows = this.db.prepare(`
      SELECT * FROM chat_messages 
      WHERE session_id = ? 
      ORDER BY created_at ASC 
      LIMIT ?
    `).all(sessionId, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      role: row.role as 'user' | 'assistant' | 'system',
      content: row.content,
      contextNodes: JSON.parse(row.context_nodes || '[]'),
      createdAt: new Date(row.created_at),
    }));
  }

  /**
   * Get recent messages across all sessions
   */
  getRecentMessages(limit: number = 50): ChatMessage[] {
    const rows = this.db.prepare(`
      SELECT * FROM chat_messages 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit) as any[];

    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      role: row.role as 'user' | 'assistant' | 'system',
      content: row.content,
      contextNodes: JSON.parse(row.context_nodes || '[]'),
      createdAt: new Date(row.created_at),
    }));
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

