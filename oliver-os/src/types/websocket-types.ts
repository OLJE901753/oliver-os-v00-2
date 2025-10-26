/**
 * WebSocket Type Definitions
 * Proper TypeScript types for WebSocket communication
 */

import { Socket } from 'socket.io';
import type { MonitoringService as MonitoringServiceClass } from '../services/monitoring-service';

// Base message types
export interface BaseWebSocketMessage {
  type: string;
  timestamp?: string;
  client_id?: string;
}

export interface WebSocketMessage<T = unknown> extends BaseWebSocketMessage {
  data: T;
}

// Extended message types for specific use cases
export interface WebSocketEventMessage extends BaseWebSocketMessage {
  event: string;
  reason?: string;
  message?: string;
}

// Union type for all message types
export type AnyWebSocketMessage = WebSocketMessage | WebSocketEventMessage;

// Specific message types
export interface ThoughtMessage {
  id: string;
  content: string;
  author: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface SystemMessage {
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: Record<string, unknown>;
}

export interface UserActionMessage {
  action: string;
  target: string;
  parameters?: Record<string, unknown>;
}

// Client connection types
export interface ConnectedClient {
  id: string;
  socket: Socket;
  user_id?: string;
  last_seen: Date;
  subscriptions: string[];
}

// Session types
export interface ThoughtSession {
  client_id: string;
  thoughts: AIResponse[];
  created_at: Date;
  last_activity: Date;
}

// Monitoring service type (use the actual class type)
export type MonitoringService = MonitoringServiceClass;

// AI Services response types
export interface AIResponse {
  success: boolean;
  data?: {
    id: string;
    content: string;
    processed_at: Date;
    metadata?: Record<string, unknown>;
  };
  error?: string;
  metadata?: Record<string, unknown>;
}

// Event handler types
export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;
export type ErrorHandler = (error: Error) => void;

// Thought creation data
export interface ThoughtCreateData {
  content: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  collaborative?: boolean;
}

// Thought analysis data
export interface ThoughtAnalyzeData {
  thought_id: string;
  analysis_type: string;
  parameters?: Record<string, unknown>;
}

// Collaboration event data
export interface CollaborationEventData {
  event_type: string;
  type: string;
  target_client?: string;
  data: Record<string, unknown>;
}

// Agent spawn data
export interface AgentSpawnData {
  agent_type: string;
  prompt?: string;
  configuration: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  target_session?: string;
}

// Voice data
export interface VoiceData {
  audio_data: string; // Base64 encoded audio
  format: string;
  metadata?: Record<string, unknown>;
}

// Health status types
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  connected_clients: number;
  active_sessions: number;
  thought_sessions: number;
  uptime: number;
  last_activity: Date;
  timestamp?: Date;
  errors: string[];
}

// Monitoring data types
export interface DashboardData {
  metrics: Record<string, unknown>;
  charts: Record<string, unknown>;
  alerts: Record<string, unknown>;
}

export interface MetricsData {
  timestamp: Date;
  cpu_usage: number;
  memory_usage: number;
  active_connections: number;
  messages_per_second: number;
}

export interface AlertData {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface PerformanceData {
  response_time: number;
  throughput: number;
  error_rate: number;
  timestamp: Date;
}

export interface TestData {
  test_name: string;
  status: 'pass' | 'fail' | 'running';
  duration: number;
  timestamp: Date;
}

export interface QualityGateData {
  gate_name: string;
  status: 'pass' | 'fail' | 'pending';
  metrics: Record<string, unknown>;
  timestamp: Date;
}

// Configuration types
export interface WebSocketConfig {
  cors: {
    origin: string[];
    credentials: boolean;
    methods: string[];
  };
  pingTimeout?: number;
  pingInterval?: number;
}
