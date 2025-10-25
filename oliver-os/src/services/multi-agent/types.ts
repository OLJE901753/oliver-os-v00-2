/**
 * Multi-Agent System Types for Oliver-OS
 * DEV MODE implementation with mock agents
 * Following BMAD principles: Break, Map, Automate, Document
 */

export type AgentType = 'frontend' | 'backend' | 'ai-services' | 'database' | 'integration';

export type AgentCapabilities = string[];

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';

export type AgentStatusType = 'idle' | 'busy' | 'error' | 'offline';

export interface AgentStatus {
  id: string;
  type: AgentType;
  status: AgentStatusType;
  capabilities: AgentCapabilities;
  currentTask?: string;
  lastActivity: string;
  metadata: Record<string, unknown>;
}

export interface AgentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastHeartbeat: string;
  uptime: number;
  tasksCompleted: number;
  tasksFailed: number;
}

export interface TaskDefinition {
  id?: string;
  name: string;
  description: string;
  assignedAgents: AgentType[];
  complexity: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number; // milliseconds
  subtasks?: string[];
  dependencies?: string[];
  metadata?: Record<string, unknown>;
}

export interface TaskProgress {
  taskId: string;
  taskName: string;
  status: TaskStatus;
  assignedAgents: AgentType[];
  agentProgress: Map<AgentType, AgentTaskProgress>;
  overallProgress: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  estimatedCompletion: string;
  subtasks: string[];
  metadata?: Record<string, unknown>;
}

export interface AgentTaskProgress {
  agentType: AgentType;
  progress: number; // 0-100
  status: TaskStatus;
  lastUpdate: string;
  subtasks: string[];
}

export interface TaskResult {
  success: boolean;
  taskId: string;
  duration: number;
  artifacts: any[];
  metrics: {
    agentsUsed: number;
    processingTime: number;
    successRate: number;
    errorCount: number;
  };
  metadata?: Record<string, unknown>;
}

export interface AgentMessage {
  id: string;
  type: 'task-assignment' | 'progress-update' | 'status-change' | 'health-check' | 'broadcast';
  sender: AgentType | 'orchestrator';
  recipient?: AgentType | 'all';
  content: Record<string, unknown>;
  timestamp: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface OrchestrationEvent {
  type: 'task:distributed' | 'task:progress' | 'task:completed' | 'agent:status-change' | 'system:health-check';
  data: Record<string, unknown>;
  timestamp: string;
}

export interface MultiAgentConfig {
  devMode: boolean;
  maxConcurrentTasks: number;
  agentTimeout: number;
  heartbeatInterval: number;
  retryAttempts: number;
  enableMetrics: boolean;
  enablePersistence: boolean;
}

export interface AgentCommunicationProtocol {
  sendMessage(message: AgentMessage): Promise<void>;
  receiveMessage(handler: (message: AgentMessage) => void): void;
  broadcastMessage(message: AgentMessage): Promise<void>;
  getAgentStatus(agentType: AgentType): Promise<AgentStatus>;
}

export interface ProgressReporting {
  reportProgress(taskId: string, agentType: AgentType, progress: number): void;
  getTaskProgress(taskId: string): TaskProgress | undefined;
  getAllActiveTasks(): TaskProgress[];
  getSystemMetrics(): SystemMetrics;
}

export interface SystemMetrics {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskDuration: number;
  systemUptime: number;
  devMode: boolean;
}

export interface AgentTaskAssignment {
  taskId: string;
  agentType: AgentType;
  subtasks: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  deadline?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentResponse {
  taskId: string;
  agentType: AgentType;
  status: 'accepted' | 'rejected' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  timestamp: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  agents: AgentType[];
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentType: AgentType;
  taskDefinition: TaskDefinition;
  dependencies?: string[];
  timeout?: number;
  retries?: number;
  metadata?: Record<string, unknown>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  steps: WorkflowStepExecution[];
  metadata: Record<string, unknown>;
}

export interface WorkflowStepExecution {
  stepId: string;
  agentType: AgentType;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: string;
  endTime?: string;
  duration?: number;
  result?: any;
  error?: string;
}

export interface AgentCapabilityMatrix {
  [key: string]: {
    frontend: boolean;
    backend: boolean;
    'ai-services': boolean;
    database: boolean;
    integration: boolean;
  };
}

export interface TaskDistributionStrategy {
  strategy: 'round-robin' | 'capability-based' | 'load-balanced' | 'priority-based';
  parameters: Record<string, unknown>;
}

export interface ErrorHandling {
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
  };
  fallbackStrategy: 'fail-fast' | 'continue-partial' | 'retry-all' | 'escalate';
  errorReporting: {
    enabled: boolean;
    channels: string[];
  };
}

export interface MonitoringConfig {
  metricsCollection: boolean;
  healthChecks: boolean;
  performanceTracking: boolean;
  alerting: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface DevModeConfig {
  enabled: boolean;
  mockResponses: boolean;
  simulateDelays: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  mockDataGeneration: boolean;
}

export interface AgentMockConfig {
  processingTimeRange: [number, number]; // [min, max] in milliseconds
  successRate: number; // 0-1
  errorSimulation: boolean;
  mockDataGeneration: boolean;
}
