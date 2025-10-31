/**
 * Service Identifiers
 * Centralized service identifiers for DI container
 */

// Core services
export const CONFIG = Symbol('Config');
export const LOGGER = Symbol('Logger');
export const DATABASE = Symbol('Database');

// LLM Providers
export const LLM_PROVIDER = Symbol('LLMProvider');
export const MINIMAX_PROVIDER = Symbol('MinimaxProvider');

// Knowledge Services
export const KNOWLEDGE_GRAPH_SERVICE = Symbol('KnowledgeGraphService');
export const CAPTURE_MEMORY_SERVICE = Symbol('CaptureMemoryService');

// Organizer Services
export const THOUGHT_ORGANIZER_SERVICE = Symbol('ThoughtOrganizerService');
export const BUSINESS_STRUCTURER = Symbol('BusinessIdeaStructurer');

// Assistant Services
export const ASSISTANT_SERVICE = Symbol('AssistantService');

// Agent Services
export const AGENT_MANAGER = Symbol('AgentManager');
export const ORCHESTRATOR = Symbol('Orchestrator');

// MCP Servers
export const GITHUB_MCP_SERVER = Symbol('GitHubMCPServer');
export const DATABASE_MCP_SERVER = Symbol('DatabaseMCPServer');
export const WEBSEARCH_MCP_SERVER = Symbol('WebSearchMCPServer');

// Monster Mode Services
export const MASTER_ORCHESTRATOR = Symbol('MasterOrchestrator');
export const ARCHITECTURE_IMPROVEMENT_SERVICE = Symbol('ArchitectureImprovementService');

