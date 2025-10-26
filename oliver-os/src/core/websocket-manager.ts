/**
 * Oliver-OS WebSocket Manager
 * Real-time communication service for thought processing and collaboration
 */

import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Socket } from 'socket.io';
import { Logger } from './logger';
import type { 
  WebSocketEventMessage,
  AnyWebSocketMessage,
  ConnectedClient, 
  ThoughtSession, 
  MonitoringService,
  AIResponse,
  ThoughtCreateData,
  ThoughtAnalyzeData,
  CollaborationEventData,
  AgentSpawnData,
  VoiceData,
  HealthStatus,
  DashboardData,
  MetricsData,
  AlertData,
  PerformanceData,
  TestData,
  QualityGateData
} from '../types/websocket-types';

export class WebSocketManager {
  private io: Server;
  private connectedClients: Map<string, ConnectedClient> = new Map();
  private thoughtSessions: Map<string, ThoughtSession> = new Map();
  private _logger: Logger;
  private aiServicesUrl: string;
  private monitoringService: MonitoringService | null = null;

  constructor(httpServer: HTTPServer, aiServicesUrl: string = 'http://localhost:8000') {
    this._logger = new Logger('WebSocketManager');
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
    this._logger.info('WebSocket Manager initialized');
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      const clientId = socket.id;
      this._logger.info(`Client connected: ${clientId}`);
      
      // Store client connection
      this.connectedClients.set(clientId, {
        id: clientId,
        socket,
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

      // Handle monitoring data requests
      socket.on('dashboard:request', () => {
        this.handleDashboardRequest(socket);
      });

      socket.on('metrics:request', () => {
        this.handleMetricsRequest(socket);
      });

      socket.on('alerts:request', () => {
        this.handleAlertsRequest(socket);
      });

      socket.on('health:request', () => {
        this.handleHealthRequest(socket);
      });

      socket.on('performance:request', () => {
        this.handlePerformanceRequest(socket);
      });

      socket.on('tests:request', () => {
        this.handleTestsRequest(socket);
      });

      socket.on('quality-gates:request', () => {
        this.handleQualityGatesRequest(socket);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });

      // Handle disconnection
      socket.on('disconnect', (reason: string) => {
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

  private async handleThoughtCreate(socket: Socket, data: ThoughtCreateData): Promise<void> {
    try {
      this._logger.info(`Processing thought creation from client: ${socket.id}`);
      
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

      const processedThought = await response.json() as AIResponse;
      
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

      this._logger.info(`Thought processed successfully: ${processedThought.data?.id || 'unknown'}`);
      
    } catch (error) {
      this._logger.error(`Error processing thought: ${error}`);
      socket.emit('thought:error', {
        type: 'thought_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        client_id: socket.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleThoughtAnalyze(socket: Socket, data: ThoughtAnalyzeData): Promise<void> {
    try {
      this._logger.info(`Analyzing thought: ${data.thought_id}`);
      
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

      this._logger.info(`Thought analysis completed: ${data.thought_id}`);
      
    } catch (error) {
      this._logger.error(`Error analyzing thought: ${error}`);
      socket.emit('thought:analysis_error', {
        type: 'thought_analysis_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        client_id: socket.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleCollaborationEvent(socket: Socket, data: CollaborationEventData): Promise<void> {
    try {
      this._logger.info(`Handling collaboration event: ${data.type}`);
      
      // Broadcast to all connected clients
      this.broadcast('collaboration:event', {
        type: 'collaboration_event',
        data,
        client_id: socket.id,
        timestamp: new Date().toISOString()
      });

      this._logger.info(`Collaboration event broadcasted: ${data.type}`);
      
    } catch (error) {
      this._logger.error(`Error handling collaboration event: ${error}`);
      socket.emit('collaboration:error', {
        type: 'collaboration_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        client_id: socket.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleAgentSpawn(socket: Socket, data: AgentSpawnData): Promise<void> {
    try {
      this._logger.info(`Spawning agent: ${data.agent_type}`);
      
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

      const spawnedAgent = await response.json() as AIResponse;

      socket.emit('agent:spawned', {
        type: 'agent_spawned',
        data: spawnedAgent,
        client_id: socket.id,
        timestamp: new Date().toISOString()
      });

      this._logger.info(`Agent spawned successfully: ${spawnedAgent.data?.id || 'unknown'}`);
      
    } catch (error) {
      this._logger.error(`Error spawning agent: ${error}`);
      socket.emit('agent:spawn_error', {
        type: 'agent_spawn_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        client_id: socket.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleVoiceData(socket: Socket, data: VoiceData): Promise<void> {
    try {
      this._logger.info(`Processing voice data from client: ${socket.id}`);
      
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

      this._logger.info(`Voice data processed successfully`);
      
    } catch (error) {
      this._logger.error(`Error processing voice data: ${error}`);
      socket.emit('voice:error', {
        type: 'voice_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        client_id: socket.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleSubscription(socket: Socket, channel: string): void {
    const client = this.connectedClients.get(socket.id);
    if (client && !client.subscriptions.includes(channel)) {
      client.subscriptions.push(channel);
      this._logger.info(`Client ${socket.id} subscribed to channel: ${channel}`);
      
      socket.emit('subscribed', {
        channel,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleUnsubscription(socket: Socket, channel: string): void {
    const client = this.connectedClients.get(socket.id);
    if (client) {
      const index = client.subscriptions.indexOf(channel);
      if (index > -1) {
        client.subscriptions.splice(index, 1);
        this._logger.info(`Client ${socket.id} unsubscribed from channel: ${channel}`);
        
        socket.emit('unsubscribed', {
          channel,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  private handleDisconnection(socket: Socket, reason: string): void {
    const clientId = socket.id;
    this._logger.info(`Client disconnected: ${clientId}, reason: ${reason}`);
    
    // Clean up client data
    this.connectedClients.delete(clientId);
    this.thoughtSessions.delete(clientId);
    
    // Notify other clients
    this.broadcastToOthers(clientId, 'client:disconnected', {
      type: 'client_disconnected',
      client_id: clientId,
      event: 'client_disconnected',
      reason,
      timestamp: new Date().toISOString()
    } as WebSocketEventMessage);
  }

  private broadcast(event: string, data: AnyWebSocketMessage): void {
    this.io.emit(event, data);
  }

  private broadcastToOthers(excludeClientId: string, event: string, data: AnyWebSocketMessage): void {
    this.io.except(excludeClientId).emit(event, data);
  }

  private broadcastToChannel(channel: string, event: string, data: AnyWebSocketMessage): void {
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

  public sendToClient(clientId: string, event: string, data: AnyWebSocketMessage): boolean {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.socket.emit(event, data);
      return true;
    }
    return false;
  }

  public sendToChannel(channel: string, event: string, data: AnyWebSocketMessage): void {
    this.broadcastToChannel(channel, event, data);
  }

  public getHealthStatus(): HealthStatus {
    return {
      status: 'healthy',
      connected_clients: this.getClientCount(),
      active_sessions: this.thoughtSessions.size,
      thought_sessions: this.thoughtSessions.size,
      uptime: process.uptime(),
      timestamp: new Date(),
      last_activity: new Date(),
      errors: []
    };
  }

  public async shutdown(): Promise<void> {
    this._logger.info('Shutting down WebSocket Manager...');
    
    // Notify all clients
    this.broadcast('server:shutdown', {
      type: 'server_shutdown',
      event: 'server_shutdown',
      message: 'Server is shutting down',
      timestamp: new Date().toISOString()
    } as WebSocketEventMessage);
    
    // Close all connections
    this.io.close();
    
    this._logger.info('WebSocket Manager shutdown complete');
  }

  public setMonitoringService(monitoringService: MonitoringService): void {
    this.monitoringService = monitoringService;
    
    // Forward monitoring events to all connected clients
    if (this.monitoringService) {
      (this.monitoringService as any).on('dashboard:data', (data: DashboardData) => {
        this._logger.info('📊 Broadcasting dashboard data to clients', { 
          clientCount: this.connectedClients.size,
          dataKeys: Object.keys(data)
        });
        this.broadcast('dashboard:data', {
          type: 'dashboard_data',
          data,
          timestamp: new Date().toISOString()
        });
      });
      
      (this.monitoringService as any).on('metrics:update', (data: MetricsData) => {
        this.broadcast('metrics:update', {
          type: 'metrics_update',
          data,
          timestamp: new Date().toISOString()
        });
      });
      
      (this.monitoringService as any).on('alerts:new', (data: AlertData) => {
        this.broadcast('alerts:new', {
          type: 'alert_new',
          data,
          timestamp: new Date().toISOString()
        });
      });
      
      (this.monitoringService as any).on('alerts:update', (data: AlertData) => {
        this.broadcast('alerts:update', {
          type: 'alert_update',
          data,
          timestamp: new Date().toISOString()
        });
      });
      
      (this.monitoringService as any).on('health:update', (data: HealthStatus) => {
        this.broadcast('health:update', {
          type: 'health_update',
          data,
          timestamp: new Date().toISOString()
        });
      });
      
      (this.monitoringService as any).on('performance:update', (data: PerformanceData) => {
        this.broadcast('performance:update', {
          type: 'performance_update',
          data,
          timestamp: new Date().toISOString()
        });
      });
      
      (this.monitoringService as any).on('tests:update', (data: TestData) => {
        this.broadcast('tests:update', {
          type: 'tests_update',
          data,
          timestamp: new Date().toISOString()
        });
      });
      
      (this.monitoringService as any).on('quality-gates:update', (data: QualityGateData) => {
        this.broadcast('quality-gates:update', {
          type: 'quality_gates_update',
          data,
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  private handleDashboardRequest(socket: Socket): void {
    if (this.monitoringService) {
      const data = this.monitoringService.getDashboardData();
      socket.emit('dashboard:data', {
        type: 'dashboard_data',
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleMetricsRequest(socket: Socket): void {
    if (this.monitoringService) {
      const data = this.monitoringService.getMetrics();
      socket.emit('metrics:update', {
        type: 'metrics_update',
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleAlertsRequest(socket: Socket): void {
    if (this.monitoringService) {
      const data = this.monitoringService.getAlerts();
      socket.emit('alerts:update', {
        type: 'alerts_update',
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleHealthRequest(socket: Socket): void {
    if (this.monitoringService) {
      const data = this.monitoringService.getSystemHealth();
      socket.emit('health:update', {
        type: 'health_update',
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handlePerformanceRequest(socket: Socket): void {
    if (this.monitoringService) {
      const data = this.monitoringService.getPerformance();
      socket.emit('performance:update', {
        type: 'performance_update',
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleTestsRequest(socket: Socket): void {
    if (this.monitoringService) {
      const data = this.monitoringService.getTestResults();
      socket.emit('tests:update', {
        type: 'tests_update',
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleQualityGatesRequest(socket: Socket): void {
    if (this.monitoringService) {
      const data = this.monitoringService.getQualityGates();
      socket.emit('quality-gates:update', {
        type: 'quality_gates_update',
        data,
        timestamp: new Date().toISOString()
      });
    }
  }
}
