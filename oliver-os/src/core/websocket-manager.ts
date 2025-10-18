/**
 * Enhanced WebSocket Manager for Oliver-OS
 * Handles real-time communication for AI-brain interface
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Logger } from './logger';
import { Config } from './config';
// import { ThoughtProcessor } from '../services/thought-processor';
// import { CollaborationService } from '../services/collaboration-service';

export interface SocketUser {
  id: string;
  name: string;
  avatar: string;
  currentThought?: string;
  cursor?: { x: number; y: number };
  lastSeen: Date;
}

export interface ThoughtMessage {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'voice' | 'image';
  metadata: Record<string, unknown>;
}

export interface CollaborationEvent {
  type: 'cursor_move' | 'thought_edit' | 'user_join' | 'user_leave' | 'thought_add' | 'thought_update';
  userId: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export class WebSocketManager {
  private io: SocketIOServer;
  private logger: Logger;
  private config: Config;
  private users: Map<string, SocketUser> = new Map();
  // private thoughtProcessor: ThoughtProcessor;
  // private collaborationService: CollaborationService;
  private redisClient: any;

  constructor(
    io: SocketIOServer,
    config: Config
    // thoughtProcessor: ThoughtProcessor,
    // collaborationService: CollaborationService
  ) {
    this.io = io;
    this.config = config;
    this.logger = new Logger('WebSocketManager');
    // this.thoughtProcessor = thoughtProcessor;
    // this.collaborationService = collaborationService;
    this.initializeRedis();
    this.setupSocketHandlers();
  }

  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = this.config.get('redis.url');
      this.redisClient = createClient({
        url: typeof redisUrl === 'string' ? redisUrl : 'redis://localhost:6379'
      });
      
      await this.redisClient.connect();
      
      // Set up Redis adapter for scaling
      const subClient = this.redisClient.duplicate();
      await subClient.connect();
      
      this.io.adapter(createAdapter(this.redisClient, subClient));
      
      this.logger.info('✅ Redis connected and Socket.io adapter configured');
    } catch (error) {
      this.logger.error('❌ Failed to connect to Redis', error);
    }
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.logger.info(`🔌 New connection: ${socket.id}`);

      // User authentication and registration
      socket.on('user:join', (userData: Partial<SocketUser>) => {
        this.handleUserJoin(socket, userData);
      });

      // Thought processing
      socket.on('thought:create', (thoughtData: Partial<ThoughtMessage>) => {
        this.handleThoughtCreate(socket, thoughtData);
      });

      socket.on('thought:update', (thoughtData: Partial<ThoughtMessage>) => {
        this.handleThoughtUpdate(socket, thoughtData);
      });

      // Real-time collaboration
      socket.on('collaboration:cursor_move', (cursorData: { x: number; y: number }) => {
        this.handleCursorMove(socket, cursorData);
      });

      socket.on('collaboration:thought_edit', (editData: Record<string, unknown>) => {
        this.handleThoughtEdit(socket, editData);
      });

      // Voice processing
      socket.on('voice:start', () => {
        this.handleVoiceStart(socket);
      });

      socket.on('voice:data', (audioData: ArrayBuffer) => {
        this.handleVoiceData(socket, audioData);
      });

      socket.on('voice:end', () => {
        this.handleVoiceEnd(socket);
      });

      // Mind visualization
      socket.on('visualization:update', (visualizationData: Record<string, unknown>) => {
        this.handleVisualizationUpdate(socket, visualizationData);
      });

      // Disconnection handling
      socket.on('disconnect', () => {
        this.handleUserDisconnect(socket);
      });

      // Error handling
      socket.on('error', (error: Error) => {
        this.logger.error('Socket error', error);
      });
    });
  }

  private handleUserJoin(socket: Socket, userData: Partial<SocketUser>): void {
    const user: SocketUser = {
      id: socket.id,
      name: userData.name || `User-${socket.id.substring(0, 8)}`,
      avatar: userData.avatar || '',
      lastSeen: new Date()
    };

    this.users.set(socket.id, user);
    socket.join('global');

    // Notify other users
    socket.to('global').emit('user:joined', user);
    
    // Send current state to new user
    socket.emit('state:current', {
      users: Array.from(this.users.values()),
      thoughts: [] // this.collaborationService.getRecentThoughts()
    });

    this.logger.info(`👤 User joined: ${user.name} (${socket.id})`);
  }

  private async handleThoughtCreate(socket: Socket, thoughtData: Partial<ThoughtMessage>): Promise<void> {
    const user = this.users.get(socket.id);
    if (!user) return;

    const thought: ThoughtMessage = {
      id: `thought-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: socket.id,
      content: thoughtData.content || '',
      timestamp: new Date(),
      type: thoughtData.type || 'text',
      metadata: thoughtData.metadata || {}
    };

    try {
      // Process thought with AI
      // const processedThought = await this.thoughtProcessor.processThought(thought);
      
      // Store in collaboration service
      // this.collaborationService.addThought(processedThought);
      
      // Broadcast to all users
      this.io.to('global').emit('thought:created', thought);
      
      this.logger.info(`💭 Thought created: ${thought.id}`);
    } catch (error) {
      this.logger.error('Failed to process thought', error);
      socket.emit('thought:error', { message: 'Failed to process thought' });
    }
  }

  private async handleThoughtUpdate(socket: Socket, thoughtData: Partial<ThoughtMessage>): Promise<void> {
    const user = this.users.get(socket.id);
    if (!user) return;

    try {
      // const updatedThought = await this.thoughtProcessor.updateThought(thoughtData.id!, thoughtData);
      
      // Update in collaboration service
      // this.collaborationService.updateThought(updatedThought);
      
      // Broadcast update
      this.io.to('global').emit('thought:updated', thoughtData);
      
      this.logger.info(`📝 Thought updated: ${thoughtData.id}`);
    } catch (error) {
      this.logger.error('Failed to update thought', error);
      socket.emit('thought:error', { message: 'Failed to update thought' });
    }
  }

  private handleCursorMove(socket: Socket, cursorData: { x: number; y: number }): void {
    const user = this.users.get(socket.id);
    if (!user) return;

    user.cursor = cursorData;
    
    // Broadcast cursor movement
    socket.to('global').emit('collaboration:cursor_move', {
      userId: socket.id,
      cursor: cursorData,
      timestamp: new Date()
    });
  }

  private handleThoughtEdit(socket: Socket, editData: Record<string, unknown>): void {
    const user = this.users.get(socket.id);
    if (!user) return;

    // Broadcast edit event
    socket.to('global').emit('collaboration:thought_edit', {
      userId: socket.id,
      data: editData,
      timestamp: new Date()
    });
  }

  private handleVoiceStart(socket: Socket): void {
    this.logger.info(`🎤 Voice recording started: ${socket.id}`);
    socket.emit('voice:ready');
  }

  private async handleVoiceData(socket: Socket, audioData: ArrayBuffer): Promise<void> {
    try {
      // Process audio data with speech-to-text
      // const transcription = await this.thoughtProcessor.processAudio(audioData);
      
      // if (transcription) {
      //   socket.emit('voice:transcription', { text: transcription });
      // }
    } catch (error) {
      this.logger.error('Failed to process voice data', error);
      socket.emit('voice:error', { message: 'Failed to process voice' });
    }
  }

  private handleVoiceEnd(socket: Socket): void {
    this.logger.info(`🎤 Voice recording ended: ${socket.id}`);
    socket.emit('voice:complete');
  }

  private handleVisualizationUpdate(socket: Socket, visualizationData: Record<string, unknown>): void {
    // Broadcast visualization updates
    socket.to('global').emit('visualization:updated', {
      userId: socket.id,
      data: visualizationData,
      timestamp: new Date()
    });
  }

  private handleUserDisconnect(socket: Socket): void {
    const user = this.users.get(socket.id);
    if (user) {
      this.users.delete(socket.id);
      
      // Notify other users
      this.io.to('global').emit('user:left', { userId: socket.id, user });
      
      this.logger.info(`👋 User left: ${user.name} (${socket.id})`);
    }
  }

  // Public methods for external access
  public getConnectedUsers(): SocketUser[] {
    return Array.from(this.users.values());
  }

  public getUserById(userId: string): SocketUser | undefined {
    return this.users.get(userId);
  }

  public broadcastToRoom(room: string, event: string, data: unknown): void {
    this.io.to(room).emit(event, data);
  }

  public async shutdown(): Promise<void> {
    this.logger.info('🛑 Shutting down WebSocket manager...');
    
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    
    this.io.close();
    this.logger.info('✅ WebSocket manager shutdown complete');
  }
}
