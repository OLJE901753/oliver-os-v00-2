import { io, Socket } from 'socket.io-client';
import { DashboardData, QualityMetric, QualityAlert, SystemHealth, PerformanceData, TestResult, QualityGate } from '@types/index';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      this.socket = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.handleReconnect();
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to monitoring WebSocket');
      this.reconnectAttempts = 0;
      this.emitToListeners('connected', true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from monitoring WebSocket');
      this.emitToListeners('connected', false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.handleReconnect();
    });

    // Dashboard data events
    this.socket.on('dashboard:data', (data: DashboardData) => {
      console.log('📊 Received dashboard data:', data);
      this.emitToListeners('dashboard:data', data);
    });

    this.socket.on('metrics:update', (metrics: QualityMetric[]) => {
      this.emitToListeners('metrics:update', metrics);
    });

    this.socket.on('alerts:new', (alert: QualityAlert) => {
      this.emitToListeners('alerts:new', alert);
    });

    this.socket.on('alerts:update', (alerts: QualityAlert[]) => {
      this.emitToListeners('alerts:update', alerts);
    });

    this.socket.on('health:update', (health: SystemHealth) => {
      this.emitToListeners('health:update', health);
    });

    this.socket.on('performance:update', (performance: PerformanceData) => {
      this.emitToListeners('performance:update', performance);
    });

    this.socket.on('tests:update', (results: TestResult[]) => {
      this.emitToListeners('tests:update', results);
    });

    this.socket.on('quality-gates:update', (gates: QualityGate[]) => {
      this.emitToListeners('quality-gates:update', gates);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emitToListeners('connection:failed', true);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emitToListeners(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  public emit(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Request specific data
  public requestDashboardData() {
    this.emit('dashboard:request', {});
  }

  public requestMetrics() {
    this.emit('metrics:request', {});
  }

  public requestAlerts() {
    this.emit('alerts:request', {});
  }

  public requestHealth() {
    this.emit('health:request', {});
  }

  public requestPerformance() {
    this.emit('performance:request', {});
  }

  public requestTestResults() {
    this.emit('tests:request', {});
  }

  public requestQualityGates() {
    this.emit('quality-gates:request', {});
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
