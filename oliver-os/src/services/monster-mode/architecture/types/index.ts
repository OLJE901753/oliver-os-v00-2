/**
 * Architecture Improvement Types
 * Centralized type definitions for architecture improvement service
 * Following BMAD principles: Break, Map, Automate, Document
 */

// Core improvement interfaces
export interface ArchitectureImprovement {
  id: string;
  type: 'scalability' | 'maintainability' | 'performance' | 'security' | 'reliability' | 'flexibility';
  category: 'system' | 'component' | 'integration' | 'data' | 'deployment' | 'monitoring';
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'analyzing' | 'applying' | 'applied' | 'rejected' | 'failed';
  rationale: string;
  alternatives: string[];
  benefits: string[];
  risks: string[];
  implementation: ImplementationPlan;
  metrics: ArchitectureMetrics;
  timestamp: string;
  appliedAt?: string;
  appliedBy?: string;
}

export interface ImplementationPlan {
  phases: ImplementationPhase[];
  timeline: string;
  resources: ResourceRequirement[];
  dependencies: string[];
  milestones: Milestone[];
}

export interface ImplementationPhase {
  id: string;
  name: string;
  description: string;
  duration: string;
  deliverables: string[];
  dependencies: string[];
  risks: string[];
}

export interface ResourceRequirement {
  type: 'human' | 'technical' | 'infrastructure' | 'financial';
  description: string;
  quantity: number;
  cost?: number;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  deadline: string;
  success: string;
  dependencies: string[];
}

export interface ArchitectureMetrics {
  before: unknown;
  after: unknown;
  improvement: number;
  confidence: number;
  risk: 'low' | 'medium' | 'high';
}

// Context interfaces
export interface ServiceContext {
  id: string;
  name: string;
  modular: boolean;
  documented: boolean;
  tested: boolean;
  authenticated: boolean;
  authorized: boolean;
  encrypted: boolean;
  redundant: boolean;
  monitored: boolean;
  configurable: boolean;
  extensible: boolean;
}

export interface AgentContext {
  id: string;
  status: 'idle' | 'busy' | 'offline';
  load?: number;
}

export interface ArchitectureContext {
  agentStatuses?: Map<string, AgentContext>;
  services?: Map<string, ServiceContext>;
  completedTasks?: Map<string, TaskContext>;
}

export interface TaskContext {
  id: string;
  actualDuration?: number;
}

// Metrics interfaces
export interface ScalabilityMetrics {
  horizontalScaling: number;
  loadBalancing: number;
  resourceUtilization: number;
  score: number;
}

export interface MaintainabilityMetrics {
  modularity: number;
  documentation: number;
  testing: number;
  score: number;
}

export interface PerformanceMetrics {
  throughput: number;
  latency: number;
  efficiency: number;
  score: number;
}

export interface SecurityMetrics {
  authentication: number;
  authorization: number;
  encryption: number;
  score: number;
}

export interface ReliabilityMetrics {
  redundancy: number;
  monitoring: number;
  faultTolerance: number;
  score: number;
}

export interface FlexibilityMetrics {
  modularity: number;
  configurability: number;
  extensibility: number;
  score: number;
}

export interface ArchitectureAnalysis {
  scalability: ScalabilityMetrics;
  maintainability: MaintainabilityMetrics;
  performance: PerformanceMetrics;
  security: SecurityMetrics;
  reliability: ReliabilityMetrics;
  flexibility: FlexibilityMetrics;
}

// Statistics and configuration
export interface ArchitectureStats {
  totalImprovements: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  averageImprovement: number;
  lastImprovements: ArchitectureImprovement[];
}

export interface ArchitectureConfig {
  enabled: boolean;
  analysis: {
    enabled: boolean;
    interval: number;
    depth: 'shallow' | 'medium' | 'deep';
  };
  suggestions: {
    enabled: boolean;
    categories: {
      scalability: boolean;
      maintainability: boolean;
      performance: boolean;
      security: boolean;
      reliability: boolean;
      flexibility: boolean;
    };
  };
  implementation: {
    enabled: boolean;
    autoApply: boolean;
    approvalRequired: boolean;
  };
  learning: {
    enabled: boolean;
    adaptationRate: number;
    historyWeight: number;
  };
}

// Pattern and strategy interfaces
export interface ArchitecturePattern {
  id: string;
  name: string;
  type: string;
  description: string;
  benefits: string[];
  drawbacks: string[];
  useCases: string[];
  implementation: string;
  examples: string[];
}

export interface ImprovementStrategy {
  id: string;
  name: string;
  description: string;
  approach: string;
  parameters: Record<string, number>;
  successRate: number;
}

