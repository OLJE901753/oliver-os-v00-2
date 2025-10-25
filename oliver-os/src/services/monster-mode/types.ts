/**
 * Monster Mode Types
 * Type definitions for Monster Mode services
 * Following BMAD principles: Break, Map, Automate, Document
 */

export interface MonsterModeConfig {
  enabled: boolean;
  version: string;
  description: string;
  masterOrchestrator: MasterOrchestratorConfig;
  taskPrioritization: TaskPrioritizationConfig;
  conflictResolution: ConflictResolutionConfig;
  workflowOptimization: WorkflowOptimizationConfig;
  architectureImprovements: ArchitectureImprovementsConfig;
  agentCoordination: AgentCoordinationConfig;
  performanceMonitoring: PerformanceMonitoringConfig;
  qualityAssurance: QualityAssuranceConfig;
  deployment: DeploymentConfig;
  backup: BackupConfig;
  disasterRecovery: DisasterRecoveryConfig;
  agents: AgentConfigs;
  workflows: WorkflowConfigs;
  integrations: IntegrationConfigs;
  monitoring: MonitoringConfig;
  security: SecurityConfig;
}

export interface MasterOrchestratorConfig {
  enabled: boolean;
  mode: 'full-automation' | 'semi-automation' | 'manual';
  maxConcurrentTasks: number;
  taskTimeout: number;
  healthCheckInterval: number;
  metricsCollectionInterval: number;
  autoRecovery: boolean;
  autoScaling: boolean;
  loadBalancing: boolean;
  conflictResolution: boolean;
  workflowOptimization: boolean;
  architectureImprovements: boolean;
  performanceMonitoring: boolean;
  errorHandling: ErrorHandlingConfig;
  security: SecurityConfig;
  logging: LoggingConfig;
}

export interface TaskPrioritizationConfig {
  enabled: boolean;
  algorithm: 'weighted-scoring' | 'priority-queue' | 'deadline-based' | 'resource-based';
  factors: TaskPrioritizationFactors;
  thresholds: TaskPrioritizationThresholds;
  dynamicAdjustment: boolean;
  learningEnabled: boolean;
  adaptationRate: number;
  historyWeight: number;
  feedbackWeight: number;
}

export interface TaskPrioritizationFactors {
  urgency: number;
  importance: number;
  complexity: number;
  dependencies: number;
  resources: number;
}

export interface TaskPrioritizationThresholds {
  high: number;
  medium: number;
  low: number;
}

export interface ConflictResolutionConfig {
  enabled: boolean;
  strategy: 'consensus-based' | 'authority-based' | 'vote-based' | 'random';
  timeout: number;
  escalationLevels: number;
  autoResolution: boolean;
  humanIntervention: boolean;
  conflictTypes: ConflictTypes;
}

export interface ConflictTypes {
  resource: boolean;
  dependency: boolean;
  priority: boolean;
  timing: boolean;
  quality: boolean;
}

export interface WorkflowOptimizationConfig {
  enabled: boolean;
  algorithm: 'genetic-algorithm' | 'simulated-annealing' | 'particle-swarm' | 'neural-network';
  optimizationFactors: WorkflowOptimizationFactors;
  optimizationInterval: number;
  learningEnabled: boolean;
  adaptationRate: number;
  historyWeight: number;
  feedbackWeight: number;
  optimizationTypes: OptimizationTypes;
}

export interface WorkflowOptimizationFactors {
  efficiency: number;
  quality: number;
  speed: number;
  resourceUtilization: number;
  cost: number;
}

export interface OptimizationTypes {
  taskScheduling: boolean;
  resourceAllocation: boolean;
  dependencyManagement: boolean;
  loadBalancing: boolean;
  performanceTuning: boolean;
}

export interface ArchitectureImprovementsConfig {
  enabled: boolean;
  analysis: ArchitectureAnalysisConfig;
  suggestions: ArchitectureSuggestionsConfig;
  implementation: ArchitectureImplementationConfig;
  learning: ArchitectureLearningConfig;
}

export interface ArchitectureAnalysisConfig {
  enabled: boolean;
  interval: number;
  depth: 'shallow' | 'medium' | 'deep';
}

export interface ArchitectureSuggestionsConfig {
  enabled: boolean;
  categories: ArchitectureCategories;
}

export interface ArchitectureCategories {
  scalability: boolean;
  maintainability: boolean;
  performance: boolean;
  security: boolean;
  reliability: boolean;
  flexibility: boolean;
}

export interface ArchitectureImplementationConfig {
  enabled: boolean;
  autoApply: boolean;
  approvalRequired: boolean;
}

export interface ArchitectureLearningConfig {
  enabled: boolean;
  adaptationRate: number;
  historyWeight: number;
}

export interface AgentCoordinationConfig {
  enabled: boolean;
  communicationProtocol: 'event-driven' | 'message-queue' | 'http' | 'websocket';
  messageQueue: 'redis' | 'rabbitmq' | 'kafka' | 'sqs';
  synchronization: 'optimistic' | 'pessimistic' | 'eventual';
  conflictDetection: boolean;
  conflictResolution: boolean;
  loadBalancing: boolean;
  failover: boolean;
  recovery: boolean;
  monitoring: boolean;
  metrics: boolean;
  alerting: boolean;
}

export interface PerformanceMonitoringConfig {
  enabled: boolean;
  metrics: PerformanceMetricsConfig;
  collection: PerformanceCollectionConfig;
  alerting: PerformanceAlertingConfig;
  optimization: PerformanceOptimizationConfig;
}

export interface PerformanceMetricsConfig {
  system: boolean;
  application: boolean;
  business: boolean;
  user: boolean;
}

export interface PerformanceCollectionConfig {
  interval: number;
  retention: string;
  aggregation: boolean;
  compression: boolean;
}

export interface PerformanceAlertingConfig {
  enabled: boolean;
  thresholds: PerformanceThresholds;
  channels: PerformanceChannels;
}

export interface PerformanceThresholds {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime: number;
  errorRate: number;
}

export interface PerformanceChannels {
  email: boolean;
  slack: boolean;
  webhook: boolean;
}

export interface PerformanceOptimizationConfig {
  enabled: boolean;
  autoTuning: boolean;
  recommendations: boolean;
  implementation: boolean;
}

export interface QualityAssuranceConfig {
  enabled: boolean;
  codeQuality: CodeQualityConfig;
  testing: TestingConfig;
  security: SecurityConfig;
}

export interface CodeQualityConfig {
  enabled: boolean;
  tools: CodeQualityTools;
  thresholds: CodeQualityThresholds;
}

export interface CodeQualityTools {
  eslint: boolean;
  prettier: boolean;
  typescript: boolean;
  vitest: boolean;
}

export interface CodeQualityThresholds {
  complexity: number;
  coverage: number;
  duplication: number;
  maintainability: number;
}

export interface TestingConfig {
  enabled: boolean;
  types: TestingTypes;
  automation: boolean;
  coverage: number;
}

export interface TestingTypes {
  unit: boolean;
  integration: boolean;
  e2e: boolean;
  performance: boolean;
}

export interface DeploymentConfig {
  enabled: boolean;
  strategy: 'blue-green' | 'rolling' | 'canary' | 'recreate';
  automation: boolean;
  rollback: boolean;
  monitoring: boolean;
  healthChecks: boolean;
  canary: boolean;
  staging: boolean;
  production: boolean;
}

export interface BackupConfig {
  enabled: boolean;
  strategy: 'full' | 'incremental' | 'differential';
  frequency: string;
  retention: string;
  compression: boolean;
  encryption: boolean;
  verification: boolean;
  restore: boolean;
}

export interface DisasterRecoveryConfig {
  enabled: boolean;
  strategy: 'multi-region' | 'single-region' | 'hybrid';
  rto: number;
  rpo: number;
  testing: boolean;
  automation: boolean;
  monitoring: boolean;
}

export interface AgentConfigs {
  frontend: AgentConfig;
  backend: AgentConfig;
  aiServices: AgentConfig;
  database: AgentConfig;
  integration: AgentConfig;
}

export interface AgentConfig {
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  maxConcurrentTasks: number;
  capabilities: string[];
  dependencies: string[];
  communication: 'http' | 'tcp' | 'udp' | 'websocket';
  monitoring: boolean;
  scaling: boolean;
}

export interface WorkflowConfigs {
  development: WorkflowConfig;
  deployment: WorkflowConfig;
  maintenance: WorkflowConfig;
}

export interface WorkflowConfig {
  enabled: boolean;
  stages: string[];
  automation: boolean;
  parallelization: boolean;
  optimization: boolean;
}

export interface IntegrationConfigs {
  codebuff: IntegrationConfig;
  github: IntegrationConfig;
  slack: IntegrationConfig;
  email: IntegrationConfig;
}

export interface IntegrationConfig {
  enabled: boolean;
  apiKey?: string;
  token?: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  repository?: string;
  branch?: string;
  webhooks?: boolean;
  channel?: string;
  notifications?: boolean;
  smtp?: any;
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: PerformanceMetricsConfig;
  dashboards: DashboardConfig;
  alerting: PerformanceAlertingConfig;
}

export interface DashboardConfig {
  enabled: boolean;
  refreshInterval: number;
  widgets: string[];
}

export interface SecurityConfig {
  enabled: boolean;
  authentication: AuthenticationConfig;
  authorization: AuthorizationConfig;
  encryption: EncryptionConfig;
  auditLogging: AuditLoggingConfig;
  rateLimiting: RateLimitingConfig;
}

export interface AuthenticationConfig {
  enabled: boolean;
  method: 'jwt' | 'oauth' | 'basic' | 'api-key';
  expiration: number;
  refresh: boolean;
}

export interface AuthorizationConfig {
  enabled: boolean;
  method: 'rbac' | 'abac' | 'acl' | 'capability-based';
  roles: string[];
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305';
  keyRotation: boolean;
}

export interface AuditLoggingConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  retention: string;
}

export interface RateLimitingConfig {
  enabled: boolean;
  requests: number;
  window: number;
}

export interface ErrorHandlingConfig {
  retryAttempts: number;
  retryDelay: number;
  circuitBreaker: boolean;
  fallbackStrategy: 'graceful-degradation' | 'fail-fast' | 'retry' | 'circuit-breaker';
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text' | 'xml';
  output: 'console' | 'file' | 'syslog' | 'remote';
  retention: string;
  rotation: boolean;
}
