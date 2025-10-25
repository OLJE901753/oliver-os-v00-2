/**
 * Multi-Agent System Index for Oliver-OS
 * Exports all multi-agent components and types
 * DEV MODE implementation with mock agents
 */

// Core orchestration
export { CentralOrchestrator } from './orchestrator';
export { MultiAgentService } from './multi-agent-service';

// Agent implementations
export { BaseAgent } from './agents/base-agent';
export { FrontendAgent } from './agents/frontend-agent';
export { BackendAgent } from './agents/backend-agent';
export { AIServicesAgent } from './agents/ai-services-agent';
export { DatabaseAgent } from './agents/database-agent';
export { IntegrationAgent } from './agents/integration-agent';

// Types and interfaces
export type {
  AgentType,
  AgentCapabilities,
  TaskStatus,
  AgentStatusType,
  AgentStatus,
  AgentHealth,
  TaskDefinition,
  TaskProgress,
  AgentTaskProgress,
  TaskResult,
  AgentMessage,
  OrchestrationEvent,
  MultiAgentConfig,
  AgentCommunicationProtocol,
  ProgressReporting,
  SystemMetrics,
  AgentTaskAssignment,
  AgentResponse,
  WorkflowDefinition,
  WorkflowStep,
  WorkflowExecution,
  WorkflowStepExecution,
  AgentCapabilityMatrix,
  TaskDistributionStrategy,
  ErrorHandling,
  MonitoringConfig,
  DevModeConfig,
  AgentMockConfig
} from './types';

// Example usage
// export { MultiAgentExample } from '../../examples/multi-agent-example';
