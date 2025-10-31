/**
 * Service Interfaces
 * Abstract interfaces for service abstraction
 */

import type { EventEmitter } from 'node:events';

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
  createNode(data: any): Promise<any>;
  createRelationship(data: any): Promise<any>;
  searchNodes(query: string, limit?: number): Promise<any[]>;
}

// Memory Capture interface
export interface IMemoryCaptureService extends IService {
  captureMemory(data: any): Promise<any>;
  getMemory(id: string): Promise<any>;
  searchMemories(query: string, limit?: number): Promise<any[]>;
}

// Agent Manager interface
export interface IAgentManager extends IService {
  spawnAgent(request: any): Promise<any>;
  getAgents(): any[];
  getSpawnedAgents(): any[];
}

// Configuration interface
export interface IConfig {
  get<T = unknown>(key: string, defaultValue?: T): T;
  set(key: string, value: unknown): void;
  load(): Promise<void>;
}

// Logger interface
export interface ILogger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

