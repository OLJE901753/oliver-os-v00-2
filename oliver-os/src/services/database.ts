/**
 * Oliver-OS Database Service
 * Prisma-based database operations for the AI-brain interface
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../core/logger';

export class DatabaseService {
  private prisma: PrismaClient;
  private _logger: Logger;

  constructor() {
    this._logger = new Logger('DatabaseService');
    this.prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'info', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });

    // Log queries in development
    if (process.env['NODE_ENV'] === 'development') {
      this.prisma.$on('query', (e) => {
        this._logger.debug(`Query: ${e.query}`);
        this._logger.debug(`Params: ${e.params}`);
        this._logger.debug(`Duration: ${e.duration}ms`);
      });
    }
  }

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    try {
      await this.prisma.$connect();
      this._logger.info('✅ Database connected successfully');
    } catch (error) {
      this._logger.error(`❌ Database connection failed: ${error}`);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this._logger.info('✅ Database connection closed');
    } catch (error) {
      this._logger.error(`❌ Error closing database connection: ${error}`);
    }
  }

  /**
   * Health check for database
   */
  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        timestamp: new Date()
      };
    } catch (error) {
      this._logger.error(`Database health check failed: ${error}`);
      return {
        status: 'unhealthy',
        timestamp: new Date()
      };
    }
  }

  // User operations
  async createUser(data: {
    email: string;
    name: string;
    avatarUrl?: string;
    preferences?: any;
  }) {
    return this.prisma.user.create({
      data: {
        ...data,
        preferences: data.preferences || {}
      }
    });
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  // Thought operations
  async createThought(data: {
    userId: string;
    content: string;
    type?: string;
    metadata?: any;
  }) {
    return this.prisma.thought.create({
      data: {
        ...data,
        type: data.type || 'text',
        metadata: data.metadata || {}
      }
    });
  }

  async getThoughtsByUserId(userId: string, limit = 50, offset = 0) {
    return this.prisma.thought.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  async searchThoughts(query: string, userId?: string) {
    // Use the custom search function from the database
    return this.prisma.$queryRaw`
      SELECT id, content, rank, created_at
      FROM search_thoughts(${query}, ${userId || null}::uuid)
      ORDER BY rank DESC, created_at DESC
    `;
  }

  async findSimilarThoughts(queryVector: number[], threshold = 0.7, limit = 10) {
    // Use the custom vector similarity function
    return this.prisma.$queryRaw`
      SELECT id, content, similarity, created_at
      FROM find_similar_thoughts(${queryVector}::vector(1536), ${threshold}, ${limit})
    `;
  }

  // Knowledge graph operations
  async createKnowledgeNode(data: {
    label: string;
    type: string;
    properties?: any;
  }) {
    return this.prisma.knowledgeNode.create({
      data: {
        ...data,
        properties: data.properties || {}
      }
    });
  }

  async createKnowledgeRelationship(data: {
    sourceId: string;
    targetId: string;
    relationshipType: string;
    properties?: any;
    weight?: number;
  }) {
    return this.prisma.knowledgeRelationship.create({
      data: {
        ...data,
        properties: data.properties || {},
        weight: data.weight || 1.0
      }
    });
  }

  // Collaboration operations
  async createCollaborationSession(data: {
    name: string;
    description?: string;
    createdBy: string;
    settings?: any;
  }) {
    return this.prisma.collaborationSession.create({
      data: {
        ...data,
        settings: data.settings || {}
      }
    });
  }

  async addParticipantToSession(sessionId: string, userId: string) {
    return this.prisma.collaborationSession.update({
      where: { id: sessionId },
      data: {
        participants: {
          push: userId
        }
      }
    });
  }

  // Real-time events
  async createRealtimeEvent(data: {
    sessionId: string;
    userId: string;
    eventType: string;
    eventData: any;
  }) {
    return this.prisma.realtimeEvent.create({
      data
    });
  }

  async getRealtimeEvents(sessionId: string, limit = 100) {
    return this.prisma.realtimeEvent.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  // AI processing results
  async createAiProcessingResult(data: {
    thoughtId: string;
    processingType: string;
    modelName?: string;
    inputData?: any;
    outputData?: any;
    confidence?: number;
    processingTimeMs?: number;
  }) {
    return this.prisma.aiProcessingResult.create({
      data
    });
  }

  // Voice recordings
  async createVoiceRecording(data: {
    userId: string;
    thoughtId?: string;
    audioFilePath?: string;
    transcription?: string;
    language?: string;
    durationSeconds?: number;
    metadata?: any;
  }) {
    return this.prisma.voiceRecording.create({
      data: {
        ...data,
        language: data.language || 'en',
        metadata: data.metadata || {}
      }
    });
  }

  // Mind visualizations
  async createMindVisualization(data: {
    userId: string;
    name: string;
    visualizationType: string;
    data: any;
    settings?: any;
    isShared?: boolean;
  }) {
    return this.prisma.mindVisualization.create({
      data: {
        ...data,
        settings: data.settings || {},
        isShared: data.isShared || false
      }
    });
  }

  // Get Prisma client for advanced operations
  getClient(): PrismaClient {
    return this.prisma;
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
