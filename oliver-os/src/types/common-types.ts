/**
 * Common Type Definitions
 * Shared types to reduce 'any' usage across the codebase
 */

import type { MemoryService } from '../services/memory/memory-service';
import type { CursorMemory, CodePattern } from '../services/memory/memory-service';

// Memory service access with proper typing
export interface MemoryServiceAccessor {
  memory?: CursorMemory;
}

// User preferences from memory
export interface UserPreferences {
  preferredImports: string[];
  preferredNaming: Record<string, string>;
  preferredPatterns: string[];
  [key: string]: unknown;
}

// Architecture decision structure
export interface ArchitectureDecision {
  id: string;
  type?: string;
  description?: string;
  [key: string]: unknown;
}

// Coding context structures
export interface FileContext {
  filePath: string;
  fileType: string;
  fileContent?: string;
  [key: string]: unknown;
}

export interface ProjectContext {
  projectStructure: string[];
  recentChanges: string[];
  architectureDecisions: string[];
  [key: string]: unknown;
}

export interface SuggestionBaseContext extends FileContext, ProjectContext {
  userPreferences: UserPreferences;
  codingPatterns: string[];
  [key: string]: unknown;
}

// Quality metrics
export interface QualityMetrics {
  complexity?: number;
  maintainability?: number;
  performance?: number;
  readability?: number;
  testability?: number;
  [key: string]: unknown;
}

// Event and callback types
export interface EventData {
  [key: string]: unknown;
}

export interface TaskArtifact {
  type: string;
  content: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface TaskMetrics {
  processingTime?: number;
  successRate?: number;
  errorCount?: number;
  [key: string]: unknown;
}

// Pattern and strategy types
export interface PatternData {
  id: string;
  type: string;
  frequency?: number;
  successRate?: number;
  pattern: unknown;
  [key: string]: unknown;
}

// Context types for different services
export interface ServiceContext {
  id: string;
  name: string;
  type?: string;
  [key: string]: unknown;
}

export interface AgentContext {
  id: string;
  status?: 'idle' | 'busy' | 'offline';
  load?: number;
  [key: string]: unknown;
}

export interface TaskContext {
  id: string;
  actualDuration?: number;
  [key: string]: unknown;
}

// Helper type for safely accessing memory service
export type MemoryServiceType = MemoryServiceAccessor | { memory?: CursorMemory };
