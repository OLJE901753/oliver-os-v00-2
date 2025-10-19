/**
 * BMAD Method Core Types - Enhanced Edition
 * For the honor, not the glory—by the people, for the people.
 */

export type BMADPhase = 'Break' | 'Map' | 'Automate' | 'Document';
export type ProjectType = 'ai-brain-interface' | 'microservices' | 'fullstack' | 'api-only' | 'frontend' | 'backend' | 'library' | 'tool';
export type Environment = 'development' | 'testing' | 'staging' | 'production';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface BMADConfig {
  bmadMethod: {
    break: TaskBreakdownConfig;
    map: ArchitectureMappingConfig;
    automate: AutomationConfig;
    document: DocumentationConfig;
  };
  workflow: WorkflowConfig;
  preferences: DevelopmentPreferences;
  environments?: EnvironmentConfigs;
  projectType?: ProjectType;
  integrations?: IntegrationConfig;
  automation?: AutomationSettings;
  metrics?: MetricsConfig;
}

export interface TaskBreakdownConfig {
  taskDecomposition: {
    enabled: boolean;
    maxTaskSize: string;
    breakdownCriteria: string[];
  };
  codeAnalysis: {
    enabled: boolean;
    dependencyMapping: boolean;
    complexityThreshold: number;
    fileSizeLimit: number;
  };
}

export interface ArchitectureMappingConfig {
  architecture: {
    enabled: boolean;
    visualization: boolean;
    dependencyGraph: boolean;
    serviceMapping: boolean;
  };
  navigation: {
    symbolSearch: boolean;
    fileRelationships: boolean;
    codeFlowAnalysis: boolean;
  };
}

export interface AutomationConfig {
  codeGeneration: {
    enabled: boolean;
    boilerplateReduction: boolean;
    patternRecognition: boolean;
    refactoringSuggestions: boolean;
  };
  processes: {
    testGeneration: boolean;
    documentationGeneration: boolean;
    errorHandling: boolean;
    validationRules: boolean;
  };
}

export interface DocumentationConfig {
  inlineDocumentation: {
    enabled: boolean;
    autoGenerate: boolean;
    includeExamples: boolean;
    updateOnChange: boolean;
  };
  testing: {
    unitTests: boolean;
    integrationTests: boolean;
    errorCaseTests: boolean;
    coverageTracking: boolean;
  };
}

export interface WorkflowConfig {
  phases: WorkflowPhase[];
}

export interface WorkflowPhase {
  name: 'Break' | 'Map' | 'Automate' | 'Document';
  description: string;
  tools: string[];
}

export interface DevelopmentPreferences {
  language: string;
  framework: string;
  backend: string;
  database: string;
  testing: string;
  documentation: string;
}

export interface ProjectStructure {
  name: string;
  type: 'microservice' | 'monolith' | 'library' | 'tool';
  dependencies: string[];
  files: ProjectFile[];
  modules: ProjectModule[];
}

export interface ProjectFile {
  path: string;
  type: 'source' | 'test' | 'config' | 'documentation' | 'build';
  size: number;
  complexity: number;
  lastModified: Date;
}

export interface ProjectModule {
  name: string;
  path: string;
  responsibilities: string[];
  dependencies: string[];
  interfaces: string[];
}

// Enhanced Configuration Types
export interface EnvironmentConfigs {
  development: EnvironmentConfig;
  testing: EnvironmentConfig;
  staging: EnvironmentConfig;
  production: EnvironmentConfig;
}

export interface EnvironmentConfig {
  debugMode: boolean;
  logLevel: LogLevel;
  autoReload: boolean;
  mockServices: boolean;
  performanceMonitoring?: boolean;
  errorTracking?: boolean;
}

export interface IntegrationConfig {
  mcp: boolean;
  codebuff: boolean;
  aiServices: boolean;
  collaboration: boolean;
  github: boolean;
  docker: boolean;
  ci: boolean;
}

export interface AutomationSettings {
  autoCommit: boolean;
  autoTest: boolean;
  autoDeploy: boolean;
  qualityGates: boolean;
  codeReview: boolean;
  dependencyUpdates: boolean;
}

export interface MetricsConfig {
  tracking: boolean;
  reporting: boolean;
  dashboards: boolean;
  alerts: boolean;
  retention: number; // days
}

// Workflow Engine Types
export interface WorkflowContext {
  projectType: ProjectType;
  projectPath: string;
  environment: Environment;
  artifacts?: string[];
  metadata?: Record<string, any>;
  integrations?: IntegrationConfig;
  config?: BMADConfig;
}

export interface WorkflowStep {
  id: string;
  phase: BMADPhase;
  dependencies: string[];
  condition?: (context: WorkflowContext) => boolean;
  execute: (context: WorkflowContext) => Promise<PhaseResult>;
  rollback?: (context: WorkflowContext) => Promise<void>;
  timeout?: number;
  retries?: number;
}

export interface WorkflowExecution {
  id: string;
  steps: WorkflowStep[];
  context: WorkflowContext;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  results: Map<string, PhaseResult>;
  startTime?: Date;
  endTime?: Date;
  progress: number;
}

export interface PhaseResult {
  phase: BMADPhase;
  success: boolean;
  data: any;
  artifacts?: string[];
  error?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  executionId: string;
  results?: PhaseResult[];
  error?: string;
  duration: number;
  context: WorkflowContext;
  summary?: ExecutionSummary;
}

export interface ExecutionSummary {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  qualityScore: number;
  recommendations: Recommendation[];
}

// Code Analysis Types
export interface AnalysisResult {
  success: boolean;
  timestamp: Date;
  duration: number;
  filesAnalyzed: number;
  issuesFound: number;
  recommendationsGenerated: number;
  qualityScore: number;
  technicalDebt: number;
  summary: string;
  details?: any;
}

export interface CodeMetrics {
  linesOfCode: number;
  totalLines: number;
  commentRatio: number;
  functionCount: number;
  classCount: number;
  importCount: number;
  exportCount: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  duplicationRatio: number;
  testCoverage: number;
  technicalDebt: number;
  securityScore?: number;
  performanceScore?: number;
}

export interface QualityGate {
  type: 'complexity' | 'maintainability' | 'duplication' | 'coverage' | 'security' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  file: string;
  line: number;
  rule?: string;
  fix?: string;
}

export interface Recommendation {
  type: 'refactoring' | 'documentation' | 'testing' | 'architecture' | 'performance' | 'security';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  examples?: string[];
  resources?: string[];
}

export interface FileAnalysis {
  path: string;
  metrics: CodeMetrics;
  issues: QualityGate[];
  recommendations: Recommendation[];
  complexity: {
    cyclomatic: number;
    cognitive: number;
    maintainability: number;
  };
  dependencies: {
    internal: string[];
    external: string[];
    unused: string[];
  };
  patterns: {
    detected: string[];
    violations: string[];
    opportunities: string[];
  };
  security: {
    vulnerabilities: string[];
    bestPractices: string[];
  };
  performance: {
    bottlenecks: string[];
    optimizations: string[];
  };
}

export interface ProjectAnalysis {
  overall: CodeMetrics;
  files: FileAnalysis[];
  architecture: {
    layers: string[];
    dependencies: Record<string, string[]>;
    violations: string[];
    patterns: string[];
  };
  quality: {
    score: number;
    gates: QualityGate[];
    trends: Record<string, number>;
    history: QualityTrend[];
  };
  recommendations: Recommendation[];
  technicalDebt: {
    total: number;
    byCategory: Record<string, number>;
    priority: 'low' | 'medium' | 'high' | 'critical';
    timeline: DebtTimeline;
  };
  security: {
    score: number;
    vulnerabilities: SecurityVulnerability[];
    recommendations: Recommendation[];
  };
  performance: {
    score: number;
    bottlenecks: PerformanceBottleneck[];
    recommendations: Recommendation[];
  };
}

export interface QualityTrend {
  date: Date;
  score: number;
  metrics: Partial<CodeMetrics>;
}

export interface DebtTimeline {
  current: number;
  projected: Record<string, number>; // month -> debt
  milestones: DebtMilestone[];
}

export interface DebtMilestone {
  date: Date;
  target: number;
  description: string;
}

export interface SecurityVulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  file: string;
  line: number;
  fix: string;
}

export interface PerformanceBottleneck {
  type: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  optimization: string;
}

// AI-Brain Interface Specific Types
export interface AIBrainConfig {
  thoughtProcessing: {
    enabled: boolean;
    models: string[];
    processingLevels: string[];
    realTime: boolean;
  };
  collaboration: {
    enabled: boolean;
    multiUser: boolean;
    realTimeSync: boolean;
    conflictResolution: boolean;
  };
  visualization: {
    enabled: boolean;
    types: ('2d' | '3d' | 'interactive')[];
    realTime: boolean;
    customization: boolean;
  };
  knowledgeGraph: {
    enabled: boolean;
    storage: string;
    indexing: boolean;
    search: boolean;
  };
}

export interface ThoughtProcessingResult {
  original: string;
  processed: string;
  insights: string[];
  patterns: string[];
  relationships: string[];
  confidence: number;
}

export interface CollaborationSession {
  id: string;
  participants: string[];
  activeThoughts: string[];
  sharedWorkspace: string;
  realTimeUpdates: boolean;
  aiEnhancement: boolean;
}

// Enhanced CLI Types
export interface CLICommand {
  name: string;
  description: string;
  options: CLIOption[];
  handler: (args: any) => Promise<void>;
}

export interface CLIOption {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'array';
  description: string;
  required?: boolean;
  default?: any;
  choices?: string[];
}

export interface CLIResult {
  success: boolean;
  output?: string;
  error?: string;
  data?: any;
  artifacts?: string[];
}

// Plugin System Types
export interface BMADPlugin {
  name: string;
  version: string;
  description: string;
  phases: BMADPhase[];
  hooks: PluginHook[];
  commands: CLICommand[];
  config?: Record<string, any>;
}

export interface PluginHook {
  phase: BMADPhase;
  event: 'before' | 'after' | 'error';
  handler: (context: WorkflowContext) => Promise<void>;
}

// Reporting Types
export interface ReportConfig {
  format: 'json' | 'html' | 'pdf' | 'markdown';
  output: string;
  sections: ReportSection[];
  templates?: string[];
}

export interface ReportSection {
  name: string;
  type: 'metrics' | 'analysis' | 'recommendations' | 'trends';
  data: any;
  visualization?: string;
}

export interface BMADReport {
  id: string;
  timestamp: Date;
  project: string;
  version: string;
  analysis: ProjectAnalysis;
  recommendations: Recommendation[];
  trends: QualityTrend[];
  summary: ReportSummary;
}

export interface ReportSummary {
  overallScore: number;
  keyMetrics: Record<string, number>;
  topIssues: QualityGate[];
  topRecommendations: Recommendation[];
  progress: Record<string, number>;
}
