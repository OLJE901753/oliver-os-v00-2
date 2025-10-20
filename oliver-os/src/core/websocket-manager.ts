/**
 * Oliver-OS WebSocket Manager
 * Real-time communication service for thought processing and collaboration
 */

import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Logger } from './logger';

export interface WebSocketMessage {
  type: string;
  data: any;
  client_id?: string;
  timestamp?: string;
}

export interface ConnectedClient {
  id: string;
  socket: any; // Socket.IO socket type
  user_id?: string;
  last_seen: Date;
  subscriptions: string[];
}

export interface ThoughtSession {
  client_id: string;
  thoughts: any[];
  created_at: Date;
  last_activity: Date;
}

export class WebSocketManager {
  private io: Server;
  private connectedClients: Map<string, ConnectedClient> = new Map();
  private thoughtSessions: Map<string, ThoughtSession> = new Map();
  private logger: Logger;
  private aiServicesUrl: string;

  constructor(httpServer: HTTPServer, aiServicesUrl: string = 'http://localhost:8000') {
    this.logger = new Logger('WebSocketManager');
    this.aiServicesUrl = aiServicesUrl;
    
    // Initialize Socket.IO server
    this.io = new Server(httpServer, {
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });
    
    this.setupEventHandlers();
    this.logger.info('WebSocket Manager initialized');
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      const clientId = socket.id;
      this.logger.info(`Client connected: ${clientId}`);
      
      // Store client connection
      this.connectedClients.set(clientId, {
        id: clientId,
        socket: socket as any, // Type assertion for compatibility
        last_seen: new Date(),
        subscriptions: []
      });

      // Initialize thought session
      this.thoughtSessions.set(clientId, {
        client_id: clientId,
        thoughts: [],
        created_at: new Date(),
        last_activity: new Date()
      });

      // Handle thought creation
      socket.on('thought:create', async (data) => {
        await this.handleThoughtCreate(socket, data);
      });

      // Handle thought analysis
      socket.on('thought:analyze', async (data) => {
        await this.handleThoughtAnalyze(socket, data);
      });

      // Handle collaboration events
      socket.on('collaboration:event', async (data) => {
        await this.handleCollaborationEvent(socket, data);
      });

      // Handle agent spawning
      socket.on('agent:spawn', async (data) => {
        await this.handleAgentSpawn(socket, data);
      });

      // Handle voice data
      socket.on('voice:data', async (data) => {
        await this.handleVoiceData(socket, data);
      });

      // Handle subscription requests
      socket.on('subscribe', (channel: string) => {
        this.handleSubscription(socket, channel);
      });

      // Handle unsubscription requests
      socket.on('unsubscribe', (channel: string) => {
        this.handleUnsubscription(socket, channel);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.handleDisconnection(socket, reason);
      });

      // Send welcome message
      socket.emit('connected', {
        client_id: clientId,
        timestamp: new Date().toISOString(),
        message: 'Connected to Oliver-OS WebSocket server'
      });
    });
  }

  private async handleThoughtCreate(socket: any, data: any): Promise<void> {
    try {
      this.logger.info(`Processing thought creation from client: ${socket.id}`);
      
      // Forward to AI services
      const response = await fetch(`${this.aiServicesUrl}/api/thoughts/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: data.content,
          user_id: data.user_id || 'anonymous',
          metadata: data.metadata || {},
          tags: data.tags || []
        })
      });

      const processedThought = await response.json() as any;
      
      // Store in session
      const session = this.thoughtSessions.get(socket.id);
      if (session) {
        session.thoughts.push(processedThought);
        session.last_activity = new Date();
      }

      // Send response to client
      socket.emit('thought:processed', {
        type: 'thought_processed',
        data: processedThought,
        client_id: socket.id,
        timestamp: new Date().toISOString()
      });

      // Broadcast to other clients if it's a collaborative thought
      if (data.collaborative) {
        this.broadcastToOthers(socket.id, 'thought:shared', {
          type: 'thought_shared',
          data: processedThought,
          client_id: socket.id,
          timestamp: new Date().toISOString()
        });
      }

      this.logger.info(`Thought processed successfully: ${processedThought.id}`);
      
    } catch (error) {
      this.logger.error(`Error processing thought: ${error}`);
      socket.emit('thought:error', {
        type: 'thought_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        client_id: socket.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleThoughtAnalyze(socket: any, data: any): Promise<void> {
    try {
      this.logger.info(`Analyzing thought: ${data.thought_id}`);
      
      const response = await fetch(`${this.aiServicesUrl}/api/thoughts/${data.thought_id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const analysis = await response.json();

      socket.emit('thought:analyzed', {
        type: 'thought_analyzed',
        data: analysis,
        client_id: socket.id,
        timestamp: new Date().toISOString()
      });

      this.logger.info(`Thought analysis completed: ${data.thought_id}`);
      
    } catch (error) {
      this.logger.error(`Error analyzing thought: ${error}`);
      socket.emit('thought:analysis_error', {
        type: 'thought_analysis_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        client_id: socket.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleCollaborationEvent(socket: any, data: any): Promise<void> {
    try {
      this.logger.info(`Handling collaboration event: ${data.type}`);
      
      // Broadcast to all connected clients
      this.broadcast('collaboration:event', {
        type: 'collaboration_event',
        data: data,
        client_id: socket.id,
        timestamp: new Date().toISOString()
      });

      this.logger.info(`Collaboration event broadcasted: ${data.type}`);
      
    } catch (error) {
      this.logger.error(`Error handling collaboration event: ${error}`);
      socket.emit('collaboration:error', {
        type: 'collaboration_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        client_id: socket.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleAgentSpawn(socket: any, data: any): Promise<void> {
    try {
      this.logger.info(`Spawning agent: ${data.agent_type}`);
      
      const response = await fetch(`${this.aiServicesUrl}/api/agents/spawn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_type: data.agent_type,
          prompt: data.prompt,
          metadata: data.metadata || {}
        })
      });

      const spawnedAgent = await response.json() as any;

      socket.emit('agent:spawned', {
        type: 'agent_spawned',
        data: spawnedAgent,
        client_id: socket.id,
        timestamp: new Date().toISOString()
      });

      this.logger.info(`Agent spawned successfully: ${spawnedAgent.id}`);
      
    } catch (error) {
      this.logger.error(`Error spawning agent: ${error}`);
      socket.emit('agent:spawn_error', {
        type: 'agent_spawn_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        client_id: socket.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleVoiceData(socket: any, data: any): Promise<void> {
    try {
      this.logger.info(`Processing voice data from client: ${socket.id}`);
      
      const response = await fetch(`${this.aiServicesUrl}/api/voice/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: data.audio_data
      });

      const transcription = await response.json();

      socket.emit('voice:transcribed', {
        type: 'voice_transcribed',
        data: transcription,
        client_id: socket.id,
        timestamp: new Date().toISOString()
      });

      this.logger.info(`Voice data processed successfully`);
      
    } catch (error) {
      this.logger.error(`Error processing voice data: ${error}`);
      socket.emit('voice:error', {
        type: 'voice_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        client_id: socket.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleSubscription(socket: any, channel: string): void {
    const client = this.connectedClients.get(socket.id);
    if (client && !client.subscriptions.includes(channel)) {
      client.subscriptions.push(channel);
      this.logger.info(`Client ${socket.id} subscribed to channel: ${channel}`);
      
      socket.emit('subscribed', {
        channel,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleUnsubscription(socket: any, channel: string): void {
    const client = this.connectedClients.get(socket.id);
    if (client) {
      const index = client.subscriptions.indexOf(channel);
      if (index > -1) {
        client.subscriptions.splice(index, 1);
        this.logger.info(`Client ${socket.id} unsubscribed from channel: ${channel}`);
        
        socket.emit('unsubscribed', {
          channel,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  private handleDisconnection(socket: any, reason: string): void {
    const clientId = socket.id;
    this.logger.info(`Client disconnected: ${clientId}, reason: ${reason}`);
    
    // Clean up client data
    this.connectedClients.delete(clientId);
    this.thoughtSessions.delete(clientId);
    
    // Notify other clients
    this.broadcastToOthers(clientId, 'client:disconnected', {
      type: 'client_disconnected',
      client_id: clientId,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  private broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  private broadcastToOthers(excludeClientId: string, event: string, data: any): void {
    this.io.except(excludeClientId).emit(event, data);
  }

  private broadcastToChannel(channel: string, event: string, data: any): void {
    // Find clients subscribed to the channel
    for (const [, client] of this.connectedClients) {
      if (client.subscriptions.includes(channel)) {
        client.socket.emit(event, data);
      }
    }
  }

  // Public methods for external use
  public getConnectedClients(): ConnectedClient[] {
    return Array.from(this.connectedClients.values());
  }

  public getClientCount(): number {
    return this.connectedClients.size;
  }

  public getThoughtSessions(): ThoughtSession[] {
    return Array.from(this.thoughtSessions.values());
  }

  public sendToClient(clientId: string, event: string, data: any): boolean {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.socket.emit(event, data);
      return true;
    }
    return false;
  }

  public sendToChannel(channel: string, event: string, data: any): void {
    this.broadcastToChannel(channel, event, data);
  }

  public getHealthStatus(): any {
    return {
      status: 'healthy',
      connected_clients: this.getClientCount(),
      thought_sessions: this.thoughtSessions.size,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down WebSocket Manager...');
    
    // Notify all clients
    this.broadcast('server:shutdown', {
      type: 'server_shutdown',
      message: 'Server is shutting down',
      timestamp: new Date().toISOString()
    });
    
    // Close all connections
    this.io.close();
    
    this.logger.info('WebSocket Manager shutdown complete');
  }
}
