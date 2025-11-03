/**
 * Service Interfaces
 * Abstract interfaces for service abstraction
 */

import type { EventEmitter } from 'node:events';
import type { KnowledgeNode, NodeCreateInput, RelationshipCreateInput } from '../../services/knowledge/node.types';
import type { Relationship } from '../../services/knowledge/relationship.types';
import type { MemoryRecord, MemoryCaptureInput } from '../../services/memory/capture/capture-memory-service';

// Base service interface
export interface IService extends EventEmitter {
  initialize(): Promise<void>;
  shutdown?(): Promise<void>;
}

// LLM Provider interface
export interface ILLMProvider {
  generate(prompt: string, context?: string): Promise<string>;
  reason(context: string, task: string): Promise<string>;
  analyzePatterns(data: Record<string, unknown>): Promise<Record<string, unknown>>;
}

// Knowledge Graph interface
export interface IKnowledgeGraphService extends IService {
  createNode(data: NodeCreateInput): Promise<KnowledgeNode>;
  createRelationship(data: RelationshipCreateInput): Promise<Relationship>;
  searchNodes(query: string, limit?: number): Promise<KnowledgeNode[]>;
}

// Memory Capture interface
export interface IMemoryCaptureService extends IService {
  captureMemory(data: MemoryCaptureInput): Promise<MemoryRecord>;
  getMemory(id: string): Promise<MemoryRecord | null>;
  searchMemories(query: string, limit?: number): Promise<MemoryRecord[]>;
}

// Agent Manager interface
export interface IAgentManager extends IService {
  spawnAgent(request: unknown): Promise<unknown>;
  getAgents(): unknown[];
  getSpawnedAgents(): unknown[];
}

// Configuration interface
export interface IConfig {
  get<T = unknown>(key: string, defaultValue?: T): T;
  set(key: string, value: unknown): void;
  load(): Promise<void>;
}

// Logger interface
export interface ILogger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

