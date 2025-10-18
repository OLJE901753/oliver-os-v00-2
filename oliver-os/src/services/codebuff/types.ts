/**
 * Codebuff SDK Integration Types for Oliver-OS
 * Following BMAD principles: Break, Map, Automate, Document
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
}

export interface CodebuffRunOptions {
  agent: string;
  prompt: string;
  agentDefinitions?: AgentDefinition[];
  customToolDefinitions?: CustomToolDefinition[];
  handleEvent?: (event: CodebuffEvent) => void;
  timeout?: number;
  retries?: number;
}

export interface CodebuffEvent {
  type: 'progress' | 'error' | 'complete' | 'status';
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export interface CodebuffResult {
  success: boolean;
  output?: string;
  error?: string;
  events: CodebuffEvent[];
  metadata: Record<string, unknown>;
}

export interface CodebuffClientConfig {
  apiKey: string;
  cwd: string;
  onError?: (error: Error) => void;
  timeout?: number;
  retries?: number;
}

export interface OliverOSAgentDefinition extends AgentDefinition {
  oliverOSCapabilities: string[];
  bmadCompliant: boolean;
  integrationPoints: string[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  agents: string[];
  status: 'idle' | 'running' | 'completed' | 'failed';
}

export interface WorkflowStep {
  agent: string;
  prompt: string;
  dependencies?: string[];
  timeout?: number;
  retries?: number;
}

export interface AgentSpawnRequest {
  agentType: string;
  capabilities: string[];
  config: Record<string, unknown>;
  workflowId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface AgentStatus {
  id: string;
  type: string;
  status: 'idle' | 'active' | 'busy' | 'error' | 'terminated';
  currentTask?: string;
  progress?: number;
  lastActivity: string;
  metadata: Record<string, unknown>;
}
