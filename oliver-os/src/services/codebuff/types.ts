/**
 * Codebuff SDK Integration Types for Oliver-OS
 * Following BMAD principles: Break, Map, Automate, Document
 * Enhanced for primary orchestration capabilities
 */

export interface AgentDefinition {
  id: string;
  displayName: string;
  model: string;
  instructionsPrompt: string;
  toolNames?: string[];
  spawnableAgents?: string[];
  customToolDefinitions?: CustomToolDefinition[];
  status?: 'idle' | 'active' | 'busy' | 'error';
  metadata?: Record<string, unknown>;
}

export interface CustomToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler?: (args: Record<string, unknown>) => Promise<unknown>;
  mcpServer?: string; // Reference to MCP server for tool execution
  timeout?: number;
  retries?: number;
}

export interface CodebuffRunOptions {
  agent: string;
  prompt: string;
  agentDefinitions?: AgentDefinition[];
  customToolDefinitions?: CustomToolDefinition[];
  handleEvent?: (event: CodebuffEvent) => void;
  timeout?: number;
  retries?: number;
  workflowId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface CodebuffEvent {
  type: 'progress' | 'error' | 'complete' | 'status' | 'agent_spawned' | 'agent_terminated' | 'workflow_started' | 'workflow_completed' | 'tool_called';
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
  agentId?: string;
  workflowId?: string;
  toolName?: string;
}

export interface CodebuffResult {
  success: boolean;
  output?: string;
  error?: string;
  events: CodebuffEvent[];
  metadata: Record<string, unknown>;
  artifacts?: Artifact[];
  duration?: number;
}

export interface Artifact {
  id: string;
  type: 'file' | 'data' | 'code' | 'report' | 'log';
  name: string;
  content: string | Buffer;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CodebuffClientConfig {
  apiKey: string;
  cwd: string;
  onError?: (error: Error) => void;
  timeout?: number;
  retries?: number;
  enableSupervision?: boolean;
  enablePersistence?: boolean;
  eventBus?: EventBus;
}

export interface EventBus {
  emit: (event: string, data: any) => void;
  on: (event: string, handler: (data: any) => void) => void;
  off: (event: string, handler: (data: any) => void) => void;
}

export interface OliverOSAgentDefinition extends AgentDefinition {
  oliverOSCapabilities: string[];
  bmadCompliant: boolean;
  integrationPoints: string[];
  supervisionConfig?: SupervisionConfig;
  toolRegistry?: string[]; // References to available tools
}

export interface SupervisionConfig {
  maxConcurrentTasks: number;
  heartbeatInterval: number;
  timeoutMs: number;
  retryPolicy: RetryPolicy;
  backoffStrategy: BackoffStrategy;
  healthCheckInterval: number;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  retryableErrors: string[];
}

export interface BackoffStrategy {
  type: 'linear' | 'exponential' | 'fibonacci';
  baseDelay: number;
  maxDelay: number;
  multiplier: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  agents: string[];
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  executionHistory: WorkflowExecution[];
}

export interface WorkflowStep {
  id: string;
  agent: string;
  prompt: string;
  dependencies?: string[];
  timeout?: number;
  retries?: number;
  tools?: string[];
  conditions?: WorkflowCondition[];
  parallel?: boolean;
  metadata?: Record<string, unknown>;
}

export interface WorkflowCondition {
  type: 'success' | 'failure' | 'timeout' | 'custom';
  expression?: string;
  handler?: (context: WorkflowContext) => boolean;
}

export interface WorkflowContext {
  workflowId: string;
  stepId: string;
  agentId: string;
  variables: Record<string, unknown>;
  artifacts: Artifact[];
  events: CodebuffEvent[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  steps: WorkflowStepExecution[];
  artifacts: Artifact[];
  events: CodebuffEvent[];
}

export interface WorkflowStepExecution {
  stepId: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: string;
  endTime?: string;
  duration?: number;
  result?: CodebuffResult;
  error?: string;
}

export interface AgentSpawnRequest {
  agentType: string;
  capabilities: string[];
  config: Record<string, unknown>;
  workflowId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  supervisionConfig?: SupervisionConfig;
  toolRegistry?: string[];
}

export interface AgentStatus {
  id: string;
  type: string;
  status: 'idle' | 'active' | 'busy' | 'error' | 'terminated';
  currentTask?: string;
  progress?: number;
  lastActivity: string;
  metadata: Record<string, unknown>;
  supervision?: AgentSupervision;
  toolRegistry?: string[];
}

export interface AgentSupervision {
  heartbeat: {
    lastSeen: string;
    interval: number;
    missed: number;
  };
  tasks: {
    current: number;
    completed: number;
    failed: number;
    total: number;
  };
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: HealthCheck[];
  };
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  timestamp: string;
  duration?: number;
}

export interface OrchestrationConfig {
  enableSupervision: boolean;
  enablePersistence: boolean;
  enableEventBus: boolean;
  enableMetrics: boolean;
  maxConcurrentWorkflows: number;
  workflowTimeout: number;
  agentTimeout: number;
  persistenceConfig: PersistenceConfig;
  metricsConfig: MetricsConfig;
}

export interface PersistenceConfig {
  enabled: boolean;
  provider: 'memory' | 'database' | 'file';
  databaseUrl?: string;
  filePath?: string;
  retentionDays: number;
  compression: boolean;
}

export interface MetricsConfig {
  enabled: boolean;
  provider: 'console' | 'prometheus' | 'custom';
  interval: number;
  customHandler?: (metrics: Metrics) => void;
}

export interface Metrics {
  timestamp: string;
  agents: {
    total: number;
    active: number;
    idle: number;
    error: number;
  };
  workflows: {
    total: number;
    running: number;
    completed: number;
    failed: number;
  };
  tools: {
    totalCalls: number;
    successRate: number;
    averageLatency: number;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
  };
}

export interface ToolRegistry {
  tools: Map<string, CustomToolDefinition>;
  mcpServers: Map<string, MCPServerInfo>;
  registerTool: (tool: CustomToolDefinition) => void;
  unregisterTool: (name: string) => void;
  getTool: (name: string) => CustomToolDefinition | undefined;
  listTools: () => CustomToolDefinition[];
  executeTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

export interface MCPServerInfo {
  name: string;
  status: 'stopped' | 'starting' | 'running' | 'error';
  port: number;
  tools: string[];
  lastError?: string;
  healthCheck?: () => Promise<boolean>;
}
