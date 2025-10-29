/**
 * Unified Agent Router Service
 * Central routing for messages from Python agent to Oliver-OS systems
 * Supports explicit routing (send to cursor/agents) and auto-mode (intelligent routing)
 */

import { Logger } from '../core/logger';
import { Config } from '../core/config';
import { MasterOrchestrator } from './monster-mode/master-orchestrator';
import type { Task } from './monster-mode/types';

export interface RouteRequest {
  sender: string;
  message: string;
  translated?: {
    type: string;
    priority: string;
    description: string;
    requirements: string[];
    estimated_duration?: number;
    dependencies?: string[];
    metadata?: Record<string, any>;
  };
  auto?: boolean;
  target?: string;
}

export interface RouteResult {
  taskId?: string;
  destination: string;
  intent: {
    type: string;
    priority: string;
    confidence: string;
  };
  message?: string;
}

export class UnifiedAgentRouter {
  private logger: Logger;
  private config: Config;
  private monster?: MasterOrchestrator;
  private initialized: boolean = false;

  constructor(config: Config) {
    this.config = config;
    this.logger = new Logger('UnifiedAgentRouter');
  }

  /**
   * Initialize the router (Monster Mode, etc.)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.info('UnifiedAgentRouter already initialized');
      return;
    }

    try {
      this.logger.info('🔀 Initializing Unified Agent Router...');
      
      // Initialize Monster Mode
      this.monster = new MasterOrchestrator(this.config);
      await this.monster.initialize();
      
      this.initialized = true;
      this.logger.info('✅ UnifiedAgentRouter ready (Monster Mode initialized)');
    } catch (error) {
      this.logger.error('Failed to initialize UnifiedAgentRouter:', error);
      throw error;
    }
  }

  /**
   * Route a message to the appropriate system
   */
  async route(request: RouteRequest): Promise<RouteResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const { sender, message, translated, auto = false, target } = request;

    this.logger.info(`📨 Routing message from ${sender}: ${message.substring(0, 50)}...`);

    // Explicit routing (send to agents = Monster Mode)
    if (target === 'monster-mode' || (!auto && !target)) {
      return await this.routeToMonsterMode(message, translated);
    }

    // Auto-mode: intelligent routing
    if (auto) {
      return await this.routeAutoMode(message, translated);
    }

    // Default: route to Monster Mode
    this.logger.warn('No explicit routing specified, defaulting to Monster Mode');
    return await this.routeToMonsterMode(message, translated);
  }

  /**
   * Route to Monster Mode (TypeScript orchestration)
   */
  private async routeToMonsterMode(
    message: string,
    translated?: RouteRequest['translated']
  ): Promise<RouteResult> {
    if (!this.monster) {
      throw new Error('Monster Mode not initialized');
    }

    try {
      // Map translated command to Monster Mode task
      const task: Omit<Task, 'id' | 'status' | 'assignedAgent' | 'startTime' | 'endTime'> = {
        type: mapTypeToMonsterMode(translated?.type || 'code-generation'),
        priority: mapPriority(translated?.priority || 'medium'),
        description: translated?.description || message,
        context: {
          originalMessage: message,
          translated: translated,
          sender: 'python-agent'
        },
        requirements: translated?.requirements || ['general'],
        dependencies: translated?.dependencies || [],
        estimatedDuration: translated?.estimated_duration || 15 * 60 * 1000,
        metadata: {
          ...translated?.metadata,
          routingSource: 'python-agent',
          translationMethod: translated ? 'translated' : 'direct'
        }
      };

      const taskId = await this.monster.submitTask(task);

      this.logger.info(`✅ Task routed to Monster Mode: ${taskId}`);

      return {
        taskId,
        destination: 'monster-mode',
        intent: {
          type: translated?.type || 'code-generation',
          priority: translated?.priority || 'medium',
          confidence: translated ? 'high' : 'medium'
        }
      };
    } catch (error) {
      this.logger.error('Failed to route to Monster Mode:', error);
      throw error;
    }
  }

  /**
   * Auto-mode: intelligent routing based on intent
   * For Phase 1: routes to Monster Mode (can expand to CodeBuff/Cursor later)
   */
  private async routeAutoMode(
    message: string,
    translated?: RouteRequest['translated']
  ): Promise<RouteResult> {
    this.logger.info('🤖 Auto-mode: Analyzing intent for routing...');

    // Phase 1: Simple routing logic (expandable later)
    // - Code generation/tasks → Monster Mode
    // - Research/questions → Could route to CodeBuff (future)
    // - Simple code edits → Could route to Cursor (future)

    const taskType = translated?.type || 'code-generation';
    const priority = translated?.priority || 'medium';

    // For now, route all to Monster Mode
    // In Phase 2+, add logic to route:
    // - Research tasks → CodeBuff
    // - Simple edits → Cursor
    // - Complex tasks → Monster Mode

    const destination = determineAutoDestination(taskType, translated);

    if (destination === 'monster-mode') {
      return await this.routeToMonsterMode(message, translated);
    }

    // Future: route to CodeBuff or Cursor
    // For now, fallback to Monster Mode
    this.logger.warn(`Auto-mode destination ${destination} not yet implemented, using Monster Mode`);
    return await this.routeToMonsterMode(message, translated);
  }

  /**
   * Get router status
   */
  getStatus(): {
    initialized: boolean;
    monsterModeReady: boolean;
  } {
    return {
      initialized: this.initialized,
      monsterModeReady: !!this.monster
    };
  }
}

/**
 * Map Python agent task types to Monster Mode task types
 */
function mapTypeToMonsterMode(type: string): Task['type'] {
  const typeMap: Record<string, Task['type']> = {
    'code-generation': 'code-generation',
    'review': 'review',
    'optimization': 'optimization',
    'documentation': 'documentation',
    'research': 'code-generation', // Research → code generation for now
    'question': 'code-generation', // Questions → code generation for now
    'debugging': 'quality-check', // Debugging → quality check
    'testing': 'quality-check' // Testing → quality check
  };

  return typeMap[type] || 'code-generation';
}

/**
 * Map priority levels
 */
function mapPriority(priority: string): Task['priority'] {
  const priorityMap: Record<string, Task['priority']> = {
    'critical': 'critical',
    'high': 'high',
    'medium': 'medium',
    'low': 'low'
  };

  return priorityMap[priority] || 'medium';
}

/**
 * Determine auto-mode destination based on task type
 * Phase 1: Always returns 'monster-mode'
 * Phase 2+: Add intelligent routing logic
 */
function determineAutoDestination(
  taskType: string,
  translated?: RouteRequest['translated']
): 'monster-mode' | 'codebuff' | 'cursor' {
  // Phase 1: All routes go to Monster Mode
  // Phase 2+: Add logic here
  // - Research tasks → codebuff
  // - Simple edits → cursor
  // - Complex tasks → monster-mode

  return 'monster-mode';
}

